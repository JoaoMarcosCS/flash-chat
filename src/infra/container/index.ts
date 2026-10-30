import { container } from 'tsyringe';
import { IUserRepository } from '@/modules/users/repository/user-repository.interface';
import { UserRepository } from '@/modules/users/repository/user.repository';
import { IChatRepository } from '@/modules/chats/repository/chat-repository.interface';
import { ChatRepository } from '@/modules/chats/repository/chat.repository';
import { ICacheProvider } from '@/infra/cache/cache-provider.interface';
import { RedisCacheProvider } from '@/infra/cache/redis-cache.provider';
import { ILogger } from '@/infra/logger/logger.interface';
import { IQueueProvider } from '@/infra/queue/queue-provider.interface';
import { RabbitMQQueueProvider } from '@/infra/queue/rabbitmq-queue.provider';
import { logger } from '@/infra/logger';

container.registerInstance<ILogger>('ILogger', logger);
container.registerSingleton<IUserRepository>('IUserRepository', UserRepository);
container.registerSingleton<IChatRepository>('IChatRepository', ChatRepository);
container.registerSingleton<ICacheProvider>('ICacheProvider', RedisCacheProvider);
container.registerSingleton<IQueueProvider>('IQueueProvider', RabbitMQQueueProvider);
