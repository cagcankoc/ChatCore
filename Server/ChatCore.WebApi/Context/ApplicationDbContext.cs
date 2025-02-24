using ChatCore.WebApi.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatCore.WebApi.Context
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<Message> Messages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Chat>()
                .HasMany(c => c.Users)
                .WithMany()
                .UsingEntity(j => j.ToTable("ChatUsers"));
        }
    }
}
