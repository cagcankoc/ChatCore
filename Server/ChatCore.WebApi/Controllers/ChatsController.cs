using ChatCore.WebApi.Context;
using ChatCore.WebApi.Dtos.ChatDtos;
using ChatCore.WebApi.Dtos.MessageDtos;
using ChatCore.WebApi.Hubs;
using ChatCore.WebApi.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using ChatCore.WebApi.Interfaces.Services;
using Prometheus;

namespace ChatCore.WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ICacheService _cacheService;

        public ChatsController(
            ApplicationDbContext context,
            IMapper mapper,
            IHubContext<ChatHub> hubContext,
            ICacheService cacheService)
        {
            _context = context;
            _mapper = mapper;
            _hubContext = hubContext;
            _cacheService = cacheService;
        }

        // Metrics
        private static readonly Histogram MessageLatency = Metrics
            .CreateHistogram("chatcore_message_processing_duration_seconds", "Histogram of message processing latency");
        private static readonly Histogram ChatLatency = Metrics
            .CreateHistogram("chatcore_chat_processing_duration_seconds", "Histogram of chat processing latency");
        private static readonly Counter TotalMessages = Metrics
            .CreateCounter("chatcore_messages_total", "Total number of messages sent", 
                new CounterConfiguration
                {
                    LabelNames = new[] { "chat_type" }
                });

        [HttpGet("UserChats")]
        public async Task<ActionResult<IEnumerable<Chat>>> GetUserChats()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("User ID not found in token"));

            var chats = await _context.Chats
                .Include(c => c.Users)
                .Include(c => c.Messages)
                .Where(c => c.Users.Any(u => u.Id == userId))
                .ToListAsync();

            return Ok(_mapper.Map<List<GetUserChatsDto>>(chats));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Chat>> GetChat(Guid id)
        {
            using (ChatLatency.NewTimer())
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? throw new UnauthorizedAccessException("User ID not found in token"));

                // Check cache
                var cacheKey = $"chat:{id}";
                var cachedChat = await _cacheService.GetAsync<GetChatDto>(cacheKey);

                if (cachedChat != null)
                {
                    if (!cachedChat.Users.Any(u => u.Id == userId))
                        return Unauthorized(new { Message = "You are not a member of this chat" });

                    return Ok(cachedChat);
                }

                // If not in cache, get from database
                var chat = await _context.Chats
                    .Include(c => c.Users)
                    .Include(c => c.Messages)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (chat == null)
                    return NotFound();
                else if (!chat.Users.Any(u => u.Id == userId))
                    return Unauthorized(new { Message = "You are not a member of this chat" });

                var chatDto = _mapper.Map<GetChatDto>(chat);

                // Save to cache (1 hour)
                await _cacheService.SetAsync(cacheKey, chatDto, TimeSpan.FromHours(1));

                return Ok(chatDto);
            }
        }

        [HttpPost]
        public async Task<ActionResult<Chat>> CreateChat(CreateChatDto createChatDto)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? throw new UnauthorizedAccessException("User ID not found in token"));

            int userCount = createChatDto.Usernames.Distinct().Count();

            if (createChatDto.IsGroupChat)
            {
                if (userCount < 3)
                    return BadRequest(new { Message = "Group chat must have minimum 3 users" });
            }
            else
            {
                if (userCount != 2)
                    return BadRequest(new { Message = "Private chat must have 2 users" });

                bool isPrivateChatExists = await _context.Chats
                    .AnyAsync(c => !c.IsGroupChat && c.Users.Count == 2 && c.Users.All(u => createChatDto.Usernames.Contains(u.Username)));
                if (isPrivateChatExists)
                    return BadRequest(new { Message = "Private chat already exists" });
            }

            var users = await _context.Users
                .Where(u => createChatDto.Usernames.Contains(u.Username))
                .ToListAsync();

            if (users.Count != userCount)
                return BadRequest(new { Message = "One or more users not found" });

            if (!users.Any(u => u.Id == userId))
                return BadRequest(new { Message = "You must be in the chat" });

            var chat = new Chat
            {
                Id = Guid.NewGuid(),
                Name = createChatDto.IsGroupChat ? createChatDto.Name : "",
                IsGroupChat = createChatDto.IsGroupChat,
                Users = users
            };

            await _context.Chats.AddAsync(chat);
            await _context.SaveChangesAsync();

            // Send notification to users added to the chat
            var chatUsers = chat.Users.Select(u => u.Id.ToString()).ToList();
            await _hubContext.Clients.Users(chatUsers).SendAsync("ChatCreated", chat);

            return CreatedAtAction(nameof(GetChat), new { id = chat.Id }, chat);
        }

        [HttpPost("messages")]
        public async Task<ActionResult<Message>> SendMessage(SendMessageDto sendMessageDto)
        {
            using (MessageLatency.NewTimer())
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? throw new UnauthorizedAccessException("User ID not found in token"));

                var chat = await _context.Chats
                    .Include(c => c.Users)
                    .FirstOrDefaultAsync(c => c.Id == sendMessageDto.ChatId);

                if (chat == null)
                    return NotFound(new { Message = "Chat not found" });

                if (!chat.Users.Any(u => u.Id == userId))
                    return BadRequest(new { Message = "Sender is not in this chat" });

                var message = new Message
                {
                    ChatId = sendMessageDto.ChatId,
                    SenderId = userId,
                    Content = sendMessageDto.Content,
                    SentAt = DateTime.UtcNow
                };

                await _context.Messages.AddAsync(message);
                await _context.SaveChangesAsync();

                // Update total message count
                TotalMessages.WithLabels(chat.IsGroupChat ? "group" : "private").Inc();

                // Update cache
                var cacheKey = $"chat:{sendMessageDto.ChatId}";
                var cachedChat = await _cacheService.GetAsync<GetChatDto>(cacheKey);
                
                if (cachedChat != null)
                {
                    var messageDto = _mapper.Map<ChatMessageDto>(message);
                    cachedChat.Messages.Add(messageDto);
                    await _cacheService.SetAsync(cacheKey, cachedChat, TimeSpan.FromHours(1));
                }

                // Send message to users in chat
                var chatUsers = chat.Users.Select(u => u.Id.ToString()).ToList();
                await _hubContext.Clients.Users(chatUsers).SendAsync("ReceiveMessage", message);

                return Ok(message);
            }
        }
    }
}
