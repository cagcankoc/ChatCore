using ChatCore.WebApi.Dtos.ChatDtos;
using ChatCore.WebApi.Dtos.MessageDtos;
using ChatCore.WebApi.Dtos.UserDtos;
using ChatCore.WebApi.Models;
using AutoMapper;

namespace ChatCore.WebApi.Mapping
{
    public class GeneralMapping : Profile
    {
        public GeneralMapping()
        {
            CreateMap<User, UserDto>();

            CreateMap<Message, ChatMessageDto>();

            CreateMap<Chat, GetUserChatsDto>()
                .ForMember(dest => dest.Users, opt => opt.MapFrom(src => src.Users));

            CreateMap<Chat, GetChatDto>()
                .ForMember(dest => dest.Users, opt => opt.MapFrom(src => src.Users))
                .ForMember(dest => dest.Messages, opt => opt.MapFrom(src => src.Messages));
        }
    }
}
