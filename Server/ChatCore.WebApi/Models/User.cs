namespace ChatCore.WebApi.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public required string Username { get; set; }
        public required string PasswordHash { get; set; }
        public string ProfilePictureUrl { get; set; } = string.Empty;
        public bool IsOnline { get; set; } = false;
        public DateTime LastSeen { get; set; }
    }
}
