namespace ChatCore.WebApi.Dtos.MessageDtos
{
    public sealed record ChatMessageDto(
        Guid SenderId,
        string Content,
        DateTime SentAt);
}
