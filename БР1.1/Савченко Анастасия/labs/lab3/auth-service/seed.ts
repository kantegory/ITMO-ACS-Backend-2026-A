import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./src/models/user.entity"
import bcrypt from "bcryptjs"

async function seed() {
  const ds = new DataSource({
    type: "postgres", host: "postgres", port: 5432,
    username: "postgres", password: "postgres",
    database: "auth_db", synchronize: true,
    entities: [User]
  })
  await ds.initialize()
  const hash = await bcrypt.hash("123456", 10)
  await ds.getRepository(User).save([
    { email: "test@test.com", password: hash, name: "Тестовый", phone_num: "+79111234567" }
  ])
  console.log("auth_db заполнена")
  await ds.destroy()
}
seed().catch(e => console.error(e))