namespace ChatCore.WebApi.Dtos.UserDtos
{
    public sealed record UserDto(
        Guid Id,
        string Username,
        string ProfilePictureUrl,
        bool IsOnline,
        DateTime LastSeen);
}
