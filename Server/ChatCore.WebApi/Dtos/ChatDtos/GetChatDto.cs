using ChatCore.WebApi.Dtos.MessageDtos;
using ChatCore.WebApi.Dtos.UserDtos;

namespace ChatCore.WebApi.Dtos.ChatDtos
{
    public sealed record GetChatDto(
        Guid Id,
        string Name,
        bool IsGroupChat,
        DateTime CreatedAt,
        List<UserDto> Users,
        List<ChatMessageDto> Messages);
}
