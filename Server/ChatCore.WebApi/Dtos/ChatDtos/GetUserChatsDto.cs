using ChatCore.WebApi.Dtos.UserDtos;

namespace ChatCore.WebApi.Dtos.ChatDtos
{
    public sealed record GetUserChatsDto(
        Guid Id,
        string Name,
        bool IsGroupChat,
        DateTime CreatedAt,
        List<UserDto> Users);
}
