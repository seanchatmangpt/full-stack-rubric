---
title: Backend Typing Drills
description: Muscle memory for Express patterns
---

# Backend Typing Drills

## Strategy

Build **muscle memory** for the exact patterns you'll type. Practice 10-minute sessions with 95%+ accuracy before focusing on speed.

## Session Structure

- **3 minutes**: Function names and signatures
- **4 minutes**: Query patterns and pipeline
- **3 minutes**: Full endpoint patterns

Target: **60-70 WPM** at **97% accuracy**

## Drill 1: Function Names (3 minutes)

Type these repeatedly until automatic:

```
parseQuery
filterByStatus
filterByOwner
filterByText
sortBy
paginate
applyCache
formatResponse
loadStore
listItems
getItemById
upsertItem
removeItem
```

## Drill 2: Query Grammar (4 minutes)

Practice the exact query patterns:

```
status=open
owner=101
q=title
sort=createdAt:desc
page=1
limit=20
useCache=true

{ filters: { status, owner, q } }
{ sort: { field, direction } }
{ data, meta: { page, limit, total } }

parse → filter → sort → paginate → respond
```

## Drill 3: Pipeline Patterns (3 minutes)

Full mini-pipelines:

```javascript
const compute = () => {
  const filtered = [filterByStatus(status), filterByOwner(owner), filterByText(q)]
    .reduce((acc, fn) => fn(acc), base);
  const sorted = sortBy(field, direction)(filtered);
  const pageData = paginate(page, limit)(sorted);
  return formatResponse(pageData, meta);
};
```

```javascript
function filterByStatus(status) {
  return xs => status ? xs.filter(x => x.status === status) : xs;
}
```

```javascript
app.get('/items', (req, res) => {
  const q = parseQuery(req);
  const base = listItems();
  res.json(compute());
});
```

## Drill 4: CRUD Endpoints (Advanced)

Once basics are fluent:

```javascript
app.get('/items/:id', (req, res) => {
  const item = getItemById(Number(req.params.id));
  res.json(item);
});

app.post('/items', (req, res) => {
  const created = upsertItem({ 
    title: req.body.title, 
    status: req.body.status, 
    owner: req.body.owner,
    createdAt: new Date().toISOString()
  });
  res.json(created);
});
```

## Drill 5: Cache Integration

```javascript
if (q.useCache) {
  const key = keyFor('/items', { ...q.filters, sort: `${q.sort.field}:${q.sort.direction}`, page: q.page, limit: q.limit });
  const out = applyCache({ get: cacheGet, set: cacheSet }, key, compute);
  res.json(out);
  return;
}
```

## Practice Tips

### Accuracy First
- 97%+ accuracy before increasing speed
- Stop and restart if accuracy drops
- Focus on clean keystrokes, not rushing

### Chunking Strategy
- Practice 2-3 line chunks until perfect
- Chain chunks together gradually
- Build up to full function signatures

### Error Patterns
- Common mistakes: missing commas, wrong quotes, typos in variable names
- Drill your specific error patterns extra
- Use consistent naming conventions

### Typing Tools

Use any typing application with custom lessons:
- **Keybr.com**: Custom text input
- **TypingClub**: Custom lessons
- **MonkeyType**: Custom word lists

## Progressive Difficulty

**Week 1**: Function names + basic patterns (60 WPM @ 97%)
**Week 2**: Pipeline composition (55-60 WPM @ 95%)  
**Week 3**: Full endpoint patterns (50-55 WPM @ 95%+)

## Expected Outcome

In the interview, syntax becomes **automatic**. Your cognitive load shifts to:
- Conversation and explanation
- System design tradeoffs  
- Extension and refactoring decisions

The typing practice creates bandwidth for higher-level thinking under pressure.