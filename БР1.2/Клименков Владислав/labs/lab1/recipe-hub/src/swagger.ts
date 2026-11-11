import fs from 'fs'
import yaml from 'yaml'

const yamlFile = fs.readFileSync('openapi.yaml', 'utf8')
export const swaggerSpec = yaml.parse(yamlFile)
