export enum MessageError {
  EMAIL_ALREADY_EXISTS = 'E-mail já cadastrado',
  NICKNAME_ALREADY_EXISTS = 'Nickname já cadastrado',
  USER_NOT_FOUND = 'Usuário não encontrado',
  CANNOT_INCLUDE_YOURSELF = 'Não é possível incluir a si mesmo',
  CHAT_NOT_FOUND = 'Chat não encontrado',
  READ_ONLY_CHAT = 'Chat somente leitura',
  MESSAGE_NOT_SENT = 'Não foi possível enviar a mensagem, tente novamente',
  INVALID_CREDENTIALS = 'Credenciais inválidas',
  INVALID_TOKEN = 'Token inválido',
  TOKEN_NOT_PROVIDED = 'Token não informado',
}
