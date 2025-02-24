using ChatCore.WebApi.Context;
using ChatCore.WebApi.Dtos.UserDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using AutoMapper;

namespace ChatCore.WebApi.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ChatHub(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;

            if (Guid.TryParse(userId, out var userGuid))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
                if (user is not null)
                {
                    user.IsOnline = true;
                    user.LastSeen = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    var userDto = _mapper.Map<UserDto>(user);
                    await Clients.All.SendAsync("UserConnected", userDto);
                }
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;

            if (Guid.TryParse(userId, out var userGuid))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userGuid);
                if (user is not null)
                {
                    user.IsOnline = false;
                    user.LastSeen = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    var userDto = _mapper.Map<UserDto>(user);
                    await Clients.All.SendAsync("UserDisconnected", userDto);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
