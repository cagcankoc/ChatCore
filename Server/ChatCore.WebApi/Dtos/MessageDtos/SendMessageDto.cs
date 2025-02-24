namespace ChatCore.WebApi.Dtos.MessageDtos
{
    public sealed record SendMessageDto(
        Guid ChatId,
        string Content);
}
