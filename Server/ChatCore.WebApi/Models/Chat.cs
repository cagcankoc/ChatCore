namespace ChatCore.WebApi.Models
{
    public class Chat
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsGroupChat { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual List<User> Users { get; set; } = new();
        public virtual List<Message> Messages { get; set; } = new();
    }
}
