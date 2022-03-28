const getDefaultSchema = () => ({
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string', description: '版本类型' },
      price: { type: 'number', description: '价格（年）' },
      capacity: { type: 'number', description: '团队人数' },
      storage: { type: 'string', description: '存储容量（GB）' },
      service: { type: 'boolean', description: '专业客户支持' },
      api: { type: 'boolean', description: 'API调用' }
    },
    required: []
  },
  required: []
})
const getDefaultData = () => [
  {
    name: '免费版',
    price: 0,
    capacity: 1,
    storage: '1G',
    service: false,
    api: false
  },
  {
    name: '基础版',
    price: 99,
    capacity: 10,
    storage: '10G',
    service: false,
    api: false
  },
  {
    name: '专业版',
    price: 499,
    capacity: 100,
    storage: '100G',
    service: true,
    api: false
  },
  {
    name: '企业版',
    price: 1999,
    capacity: 1000,
    storage: '1000G',
    service: true,
    api: true
  }
]

export function getDefaultValue() {
  return {
    schema: getDefaultSchema(),
    data: getDefaultData()
  }
}
