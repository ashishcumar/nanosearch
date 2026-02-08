import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const WORD_PATH = path.join(__dirname, "..", "words.txt")
const OUTPUT_PATH = path.join(__dirname,'..','public','trie.bin')

const emptyNod = () => ({
    char: -1,
    left: -1,
    right: -1,
    next: -1,
    isEnd:0
})

const insert = (nodes, nodeIdx, word, charIdx) => {
    if (charIdx >= word.length) return

    const n = nodes[nodeIdx] ?? (nodes[nodeIdx] = emptyNod())
    const ch = word.charCodeAt(charIdx)

    if (n.char === -1) n.char = ch

    const isLast = charIdx === word.length - 1

    if (ch < n.char) {
        if (n.left === -1) { n.left = nodes.length; nodes.push(emptyNod()) }
        insert(nodes, n.left, word, charIdx)
    } else if (ch > n.char) {
        if (n.right === -1) { n.right = nodes.length; nodes.push(emptyNod()) }
        insert(nodes, n.right, word, charIdx)
    } else if (isLast) {
        n.isEnd = 1
    } else {
        if (n.next === -1) { n.next = nodes.length; nodes.push(emptyNod()) }
        insert(nodes, n.next, word, charIdx + 1)
    }
}

const LOG_INTERVAL = 50000

const buildTrie = (words) => {
    const cleaned = words.map((w) => w.trim()).filter(Boolean)
    console.log(`[1/4] Building trie from ${cleaned.length} words (logging every ${LOG_INTERVAL} words)...`)
    const start = Date.now()
    const nodes = [emptyNod()]

    for (let i = 0; i < cleaned.length; i++) {
        insert(nodes, 0, cleaned[i], 0)
        if ((i + 1) % LOG_INTERVAL === 0) {
            const elapsed = ((Date.now() - start) / 1000).toFixed(1)
            const rate = ((i + 1) / (Date.now() - start) * 1000).toFixed(0)
            const pct = (((i + 1) / cleaned.length) * 100).toFixed(1)
            console.log(`       ${i + 1} / ${cleaned.length} (${pct}%) — ${elapsed}s elapsed — ~${rate} words/sec`)
        }
    }

    console.log(`[2/4] Trie built in ${((Date.now() - start) / 1000).toFixed(2)}s — ${nodes.length} nodes`)
    return nodes
} 

const trieToInt32Array = (nodes) => {
    const header = [3, nodes.length, 0]
    const flat = nodes.flatMap((n) => [n.char, n.left, n.right, n.next, n.isEnd])
    return new Int32Array([...header,...flat])
}

const main = () => {
    const totalStart = Date.now()
    console.log("=== NanoSearch Trie Builder ===\n")

    console.log("[0/4] Reading words.txt...")
    const words = fs.readFileSync(WORD_PATH, "utf-8").split("\n")
    console.log(`       Loaded ${words.length} lines\n`)

    const nodes = buildTrie(words)

    console.log("[3/4] Serializing to Int32Array...")
    const arr = trieToInt32Array(nodes)
    console.log(`       Buffer size: ${(arr.byteLength / 1024 / 1024).toFixed(2)} MB\n`)

    console.log("[4/4] Writing trie.bin...")
    const dir = path.dirname(OUTPUT_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(OUTPUT_PATH, Buffer.from(arr.buffer))
    console.log(`       Saved to ${OUTPUT_PATH}\n`)

    const totalMs = ((Date.now() - totalStart) / 1000).toFixed(2)
    console.log(`=== Done in ${totalMs}s ===`)
}


main()