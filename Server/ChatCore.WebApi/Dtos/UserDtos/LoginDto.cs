namespace ChatCore.WebApi.Dtos.UserDtos
{
    public sealed record LoginDto(
        string Username,
        string Password);
}
