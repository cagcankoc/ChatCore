namespace ChatCore.WebApi.Dtos.UserDtos
{
    public sealed record RegisterDto(
        string Username,
        string Password,
        string ProfilePictureUrl);
}
