import React, { useState } from 'react'
import axios from 'axios'

function BookCard({ book }: { book: any }) {
    const title = book.title || book.title_suggest
    const author = (book.author_name && book.author_name[0]) || 'Unknown'
    const cover = book.cover_edition_key ? `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-M.jpg` : undefined
    return (
        <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
            {cover && <img src={cover} alt="cover" style={{ width: 80, height: 120, objectFit: 'cover' }} />}
            <h3>{title}</h3>
            <div>{author}</div>
        </div>
    )
}

export default function App() {
    const [q, setQ] = useState('')
    const [results, setResults] = useState<any[]>([])

    async function search(e: any) {
        e.preventDefault()
        const r = await axios.get('https://openlibrary.org/search.json', { params: { q } })
        setResults(r.data.docs || [])
    }

    return (
        <div style={{ padding: 20, fontFamily: 'Arial' }}>
            <h1>Online Library — Search</h1>
            <form onSubmit={search} style={{ marginBottom: 20 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Title or author" style={{ padding: 8, width: 300 }} />
                <button style={{ marginLeft: 8, padding: '8px 12px' }}>Search</button>
            </form>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12 }}>
                {results.map(b => <BookCard key={b.key} book={b} />)}
            </div>
        </div>
    )
}
