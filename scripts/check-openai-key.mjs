const k = process.env.OPENAI_API_KEY || ''
console.log('suffix', k.slice(-6), 'len', k.length)

fetch('https://api.openai.com/v1/models', {
  headers: { Authorization: `Bearer ${k}` },
})
  .then(async (r) => {
    const t = await r.text()
    console.log('status', r.status)
    console.log(t.slice(0, 300))
    process.exit(r.ok ? 0 : 2)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
