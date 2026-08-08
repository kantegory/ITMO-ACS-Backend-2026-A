declare module 'amqplib' {
  const amqp: {
    connect(url: string): Promise<any>;
  };
  export default amqp;
}
