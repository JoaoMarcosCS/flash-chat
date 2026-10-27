import { container } from 'tsyringe';
import { IUserRepository } from '@/modules/users/repository/IUserRepository';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { IChatRepository } from '@/modules/chats/repository/IChatRepository';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { ICacheProvider } from '@/infra/cache/ICacheProvider';
import { RedisCacheProvider } from '@/infra/cache/RedisCacheProvider';
import { ILogger } from '@/infra/logger/ILogger';
import { logger } from '@/infra/logger';

container.registerInstance<ILogger>('ILogger', logger);
container.registerSingleton<IUserRepository>('IUserRepository', UserRepository);
container.registerSingleton<IChatRepository>('IChatRepository', ChatRepository);
container.registerSingleton<ICacheProvider>('ICacheProvider', RedisCacheProvider);
