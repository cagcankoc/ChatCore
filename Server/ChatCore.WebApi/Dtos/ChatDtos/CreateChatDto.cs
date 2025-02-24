namespace ChatCore.WebApi.Dtos.ChatDtos
{
    public sealed record CreateChatDto(
        IReadOnlyList<string> Usernames,
        string Name = "",
        bool IsGroupChat = false);
}
