# ManaGEM — "Please Hold"

Product-truth pass · Round 4 · what ManaGEM changes in this story

This document answers one question before the shooting script is locked: does the
film demonstrate a real operational improvement, or does it show an employee
navigating software? It revises part two of the 45-second script in
`please-hold-production-readiness.md` and leaves part one untouched.

It contains no video-generation prompts and no footage.

---

## 0. Verdict

**The approved direction stands.** The three-part question, the four-person chain,
Lerato's resolution and the line all survive.

**One product-truth problem was found, and it changes who the second caller is.**

In Round 3 the caller on day two was a new customer asking for a price, whether the
material was in, and when work could start. ManaGEM can answer the first two for a
new job. It cannot answer the third: a start date appears in the product only once a
booking exists. For a job nobody has booked yet, the honest answer still lives in the
owner's head. Lerato reading a start date off the screen for a job that has not been
accepted would be showing something the product does not do.

**The fix:** the day-two caller is an existing customer whose job is quoted, accepted
and booked, phoning before his own trustees' meeting to confirm the same three
things. For that job, all three answers are literally on the screen. It is also a
caller asking, almost word for word, where his job stands.

Two smaller corrections follow from the same test:

- Lerato now says the figure on the screen, not a conclusion drawn from it.
  "Membrane's in the store" becomes "Forty-two drums in the store."
- "VAT included" is cut. It is true, but it is a fourth fact with no picture.

### Additional checks made on the product build for this pass

| Checked | Result |
| --- | --- |
| Search box on the Bookings list | Works. Typing a customer name leaves that customer's booking row |
| Dashboard rows | A row in Recent Sales Activity opens the enquiry record. A project card opens the jobs list |
| Customer record | A placeholder page in the build. Not usable in the film |
| Stock dispatch | A list titled "Material dispatched to projects", with each dispatch tied to an enquiry reference, a store and a staff member |

As before, this is a prototype build. GEMIS must confirm each point in the live
product.

---

## 1. Before and after

### What actually changes

ManaGEM does not make anyone faster at their own job. Mr Jacobs counts as quickly as
he did. Lerato finds a quote as quickly as she did. What changes is **where an
answer lives once it is known.**

- **Before:** each fact is known by one person and has to be asked for every time
  someone needs it. An answer with three parts needs three people to be reachable in
  the same three minutes.
- **After:** each fact is recorded once, when it happens, in a system the whole
  office shares. The quote is saved when it is sent. Stock is recorded when it is
  received. The crew is booked when the job is confirmed. From then on the answer
  needs one person and no phone calls.

The operational improvement is not "fewer clicks". It is that **the response no
longer depends on who can be reached.**

### The customer's experience

| | Before | After |
| --- | --- | --- |
| Who they speak to | The owner, on his mobile, on a roof | Whoever picks up the office phone |
| What they hear | "One second", then hold music | The answer |
| How long it takes | Three minutes, if all three people are free. A callback, if not | The length of the call |
| How many people their question passes through | Three | One |
| What they conclude about the business | They are busy and I am not their priority | They know my job |
| What they do next | Whatever the clock forces them to do | Go into their meeting with the facts |

### The administrator's experience

| | Before | After |
| --- | --- | --- |
| Her role on the call | A relay. She holds one piece and fetches the other two | The person who answers |
| What she has in front of her | Her own files | The quote, the stock and the bookings, in one login |
| What she has to do | Put one person on hold, phone a second, wait for a third | Look it up while the caller is still talking |
| Who she interrupts | The owner on site and the storeman mid-count | Nobody |
| How she records it | A sticky note on the monitor | Nothing to record. It is already there |
| How the call ends for her | She delivers a correct answer nobody is left to hear | "I just did." |

### And the owner, who is the buyer

Before, every customer question ends at his phone, because he is the only person who
can assemble the whole answer. After, the office answers a question about his
business while he is on his knees pressing a seam, and he never knows the call
happened. That single image, shot 15, is the proposition "your business shouldn't run
you" without anyone saying it.

### What the film must not imply

- That ManaGEM knows things nobody entered. The stock figure is right because stock
  was received into the system; the booking exists because someone made it.
- That it would have saved Anusha's exact call on day one. Her job was not booked, so
  its start date was still a judgement. The film shows a business that could not
  answer, then the same business answering a question it can now fully answer. It
  does not replay day one with a different outcome.
- That it is instant. See section 2.

---

## 2. Is the multi-click workflow realistic enough to show?

### What the workflow really is

Recounted against the build, it is four clicks and three short typed searches, across
three modules:

1. Type the customer's name in the Open Enquiries search. One row remains.
2. Click the row. The enquiry record opens. **Grand Total.**
3. Click Products & Pricing. Type the product name. One or two rows remain. **Stock.**
4. Click Projects Module. Click Bookings & Calendar. Type the customer's name. One
   row remains. **Start date, foreman.**

### The honest assessment

**As a workflow, yes.** A practised administrator would do this in perhaps ten to
fifteen seconds. That figure is an estimate; it has not been timed on a live
account. Against three minutes, three people and a lost customer, ten seconds at one
desk is a real improvement, and it is one a contractor will recognise as true. A film
that showed a single magic screen would be less believable to this audience, not
more.

**As a picture, no.** Showing four clicks and three module changes in four seconds
would be exactly the thing to avoid: unreadable, and about the software rather than
the business. So the film does not show the navigation.

### How the film handles it

- **We watch her begin, and we see what she finds.** One over-shoulder shot shows
  the first search and click. After that the film cuts only to results: one label and
  one value per shot. The movement between modules happens in the cuts, marked by a
  mouse click on the soundtrack.
- **The scene is not about speed.** It is about nobody being put on hold. The
  payoff image is not the screen; it is the owner's silent phone.
- **Screen time is honest.** From lifting the receiver to "I just did" is about
  eleven and a half seconds of film. The real task must fit inside the time the film
  implies. This is the condition for showing it at all.

### The substantiation rule

Before the script is locked, the complete sequence is performed on the live product
with the film's example account, by a normal user at normal speed, and recorded as
one unbroken screen recording with a clock.

- **Fifteen seconds or less:** the scene is shot as written, and the recording is
  kept as evidence for the claim the scene makes.
- **More than fifteen seconds:** the film drops to two look-ups, price and start
  date, as the 15-second version already does. The stock answer is cut.
- The filmed monitor in shot 11 shows the real product responding to the actor's
  real hands. No look-up is faked or sped up.

---

## 3. Which capabilities the story needs

### Essential

| Capability | Why the story cannot do without it | Seen in the build |
| --- | --- | --- |
| The enquiry record holds the quote, with its Grand Total | The price answer | Yes |
| A list can be searched by customer name | It is how she gets to the job without hunting | Yes, on Open Enquiries, Current Jobs, Bookings and Products & Pricing |
| Products carry an on-hand stock figure | The material answer, and the reason Mr Jacobs is not phoned | Column seen. Whether the figure is live on-hand stock is unconfirmed |
| Bookings carry a start date and a foreman | The start answer, and the reason Sizwe is not phoned | Yes |
| All three sit behind one login the office has | The whole point: one person can see what three people used to hold | Yes |

That is the complete list. Five capabilities, all plain, none of them a headline
feature. The film is persuasive precisely because it rests on the ordinary core of
the product.

### Unnecessary, and kept out

| Capability | Why it stays out |
| --- | --- |
| The global search bar and ⌘K | Inert in the build. Not needed, since list search does the job |
| The dashboard | A dense screen that cannot be read in a second. It may be on the monitor when she sits down, out of focus, and nothing more |
| Enquiry stages, deposit status, the timeline | True and useful, but they are a fourth and fifth fact |
| Quote PDFs, templates, price history, cost prices | Belong to making a quote, not to answering a call |
| Job progress percentages, on-track and delayed | The strongest support for the end line, but a different story. Better used in a second film |
| Stock dispatch to projects | A real link between stock and a job, and tempting. It records material that has left the store, which answers "has it gone to site?", not "has it come in?" |
| Invoices, debtors, Sage sync | The landing page's job |
| Factory, warranties, inspection reports, sales targets | Not in this customer's question |

### Not available, and therefore never implied

A single record joining price, stock and start date. Stock reserved against a job. A
customer record page. A job detail page. A mobile or tablet view. Job costing or
margin.

---

## 4. Does the picture support the words?

Each sentence Lerato speaks must be a reading of the screen the viewer is looking at.
Tested line by line:

| Round 3 line | What the viewer sees | Verdict | Final line |
| --- | --- | --- | --- |
| "Ninety-two, four hundred, VAT included." | The label *Grand Total* and the figure | The figure is supported. "VAT included" is not shown in a way that can be read in the time | **"Ninety-two, four hundred."** |
| "Membrane's in the store." | A product row and a number under *STOCK* | A conclusion, not a reading. A viewer sees "42", not "in the store" | **"Forty-two drums in the store."** |
| "Thabo's team starts Monday the fourth." | A booking row: start date, days, foreman | Supported, once the caller's job is a booked job. Not supported for a new enquiry | **"Thabo's team, Monday the fourth."** |
| "I just did." | Everything above | Supported, provided the real task fits the time on screen | **"I just did."** |

### Framing rules that make this true on screen

- **One label, one value per insert.** The Grand Total line. The STOCK header with
  the figure beneath it. The START and FOREMAN columns of one booking row.
- **The search does the cropping.** Because each list has been filtered to a single
  row, the column header sits directly above the value. Nothing is rearranged,
  re-typeset or highlighted in post.
- **The stock insert is the difficult one.** On the product list the description is
  at the left of a wide row and the stock figure at the far right. The insert frames
  the right-hand end, *STOCK* and *42*, and relies on the preceding shot, where she
  types the product name, and on her line. This is the insert most likely to fail the
  legibility test already planned.
- **The spoken day of the week must be true.** The screen shows a date; "Monday" is
  her reading of it. The example booking is set to a date that is a Monday close to
  the air date.

---

## 5. Is "Know where every job stands" still the right line?

**Yes. It is better supported than it was a round ago.**

### What it promises, tested against the product

| Reading of the line | Supported by |
| --- | --- |
| You can see what stage every enquiry is at | The enquiry pipeline: new lead, quoted, deposit paid, in progress, invoiced |
| You can see how every job is progressing | Jobs with foreman, start, end and progress; on-track and delayed on the dashboard |
| You can see what has been billed and what is owed | Invoices by status; debtors aged by customer |
| Anyone in the office can see it, not only the owner | One login, shared lists |

Every reading is something the build shows. No reading requires job costing, a
mobile app or a single joined record. It is also the website's headline, so the film
and the page it sends people to make one promise.

### How it fits the film now

In Round 3 the second caller was a prospect, and the line was a general statement
laid over a new-business scene. With the corrected caller, the second scene **is the
line**: a customer rings to find out where his job stands, and the business knows.
The fix made for product truth also tightens the advertising.

### Alternatives tested and rejected

| Line | Why not |
| --- | --- |
| *Know what's making you money.* | The logo's tagline. The product shows no margin per job; the site audit removed that promise |
| *Every job on one record.* | No joined record exists in the build |
| *The first answer wins the job.* | A promise about the customer's result, not about the product, and not something that can be substantiated |
| *Your business shouldn't run you.* | The founding thought, and still the feeling of the film, but it names no benefit and no product |
| *Have the answer.* | Sharp and true to the scene, but could be any software. It does not say "jobs", which is what ManaGEM is for |

### One sentence to watch

The voiceover at the turn, "The job goes to whoever answers first", comments on day
one, where a prospect is lost. Day two is now about a customer who is kept
confident, not a prospect who is won. The line is still true of what we have just
watched and it is a general observation, not a claim about ManaGEM, so it stays. It
should not be repeated on the end card or in other media as if it were the product's
promise.

---

## 6. The final product demonstration sequence

### The scene in one paragraph

Morning. The office phone rings. A trustee from a block where the job is already
booked wants three things confirmed before his meeting tonight. Lerato's finger goes
to the HOLD key and stops. She searches his block's name, opens the record, and
reads him the price. A click: the drums are in the store. A click: Thabo's team, the
fourth. On the roof, Sizwe's phone stays in his pocket. The trustee asks if she needs
to check. She just did.

### Revised part two — replaces shots 9 to 17

Part one, shots 1 to 8, is unchanged. Times are in seconds and tenths.

| Shot | Time | Dur | Picture and action | Dialogue | Sound |
| --- | --- | --- | --- | --- | --- |
| **9** | 0:28.5–0:30.0 | 1.5 | INT. CONTRACTOR'S OFFICE, morning. Lerato sits, mug in hand. The monitor edge is bare. ManaGEM is open on Open Enquiries. The desk phone rings; she lifts the receiver | None | VO from shot 8 ends at 0:29.2. Ring at 0:29.3. Birds |
| **10** | 0:30.0–0:31.5 | 1.5 | INSERT. Her finger travels to the HOLD key, stops above it, withdraws | CALLER (phone, from 0:30.2): "Morning. Acacia Mews. Trustees meet tonight…" | Receiver voice |
| **11** | 0:31.5–0:33.5 | 2.0 | Over her shoulder, filmed live. She types *Acacia* in the list's Search box. The list narrows to one row. She clicks it `[V1]` | CALLER (cont.): "…price, material, start date?" | Keys. One click |
| **12** | 0:33.5–0:35.0 | 1.5 | SCREEN INSERT. The foot of the quote: *Grand Total* and its figure `[V2]` | LERATO: "Ninety-two, four hundred." | Her voice, close |
| **13** | 0:35.0–0:36.5 | 1.5 | SCREEN INSERT. Products & Pricing, filtered to the membrane: *STOCK* above *42* `[V3]` | LERATO: "Forty-two drums in the store." | Click on the cut |
| **14** | 0:36.5–0:37.8 | 1.3 | SCREEN INSERT. Bookings, filtered to the customer: *START*, *DAYS*, *FOREMAN* above the row's date and name `[V4]` | LERATO: "Thabo's team…" | Click on the cut |
| **15** | 0:37.8–0:39.2 | 1.4 | EXT. ROOF, another day. Sizwe from behind, kneeling with his crew, pressing a seam. His phone is in his back pocket. It does not ring | LERATO (over): "…Monday the fourth." | Wind. A roller |
| **16** | 0:39.2–0:41.5 | 2.3 | INT. CONTRACTOR'S OFFICE. Medium close-up, Lerato, lit by the screen. She listens, answers, reaches for her mug | CALLER: "…You don't need to check?" LERATO: "I just did." | A beat of quiet first |
| **17** | 0:41.5–0:45.0 | 3.5 | END CARD. Navy. Logo. *Know where every job stands.* At 0:43.0: *Start your free trial · managem.co.za* `[V5]` | VO: "ManaGEM. Know where every job stands." | The tune's phrase, resolved, by a small band |

### What changed from Round 3, and nothing else

| Change | Reason |
| --- | --- |
| The caller is an existing customer with a booked job | Product truth: a start date exists only for a booked job |
| "Trustees meet tonight" | It mirrors Anusha's deadline, so the two days are the same situation with a different ending |
| "VAT included" cut | No readable picture for it |
| "Membrane's in the store" becomes "Forty-two drums in the store" | She reads the screen; she does not interpret it |
| Stock insert lengthened to 1.5 s, booking insert to 1.3 s, roof shortened to 1.4 s | The stock figure is the hardest to read |

### The shorter versions

- **30 seconds.** The caller's line becomes "Morning, Acacia Mews. Price, material,
  start date?" Lerato's three answers are the final lines above. Nothing else moves.
- **15 seconds.** Two inserts, price and start date, as already planned. Lerato:
  "Ninety-two, four hundred. Thabo's team, Monday the fourth."

### What the example account must contain

One fictitious customer, with:

- an enquiry at a booked stage, whose quote totals exactly the spoken price;
- the membrane product from that quote, with 42 on hand and above its low-stock
  minimum;
- a booking for that customer, scheduled, with the foreman named Thabo and a start
  date that is a Monday close to the air date;
- a user named Lerato.

Enough other fictitious customers, products and bookings should surround it that the
lists look like a working business before they are filtered.

### Verification register, updated

| Ref | To confirm in the live product | If not |
| --- | --- | --- |
| **V1** | Open Enquiries filters by customer name, and a row opens that enquiry's own record | She scrolls to the row |
| **V2** | The enquiry record shows the quote's Grand Total | No fallback. The scene depends on it |
| **V3** | The STOCK figure on Products & Pricing is current on-hand stock, kept up to date by receiving and dispatching | Cut shot 13 and its line. Two answers, as in the 15-second version |
| **V4** | A scheduled booking shows start date and foreman and can be found by customer name | Use the Current Jobs row |
| **V5** | The CTA wording, the trial terms and the address | *See how it works · managem.co.za* |
| **V7** | The clean example account described above. No real customer data | Production does not start |
| **V8** | Spoken figures, names and the day of the week match the screen | Change the record |
| **V10, new** | The whole sequence, performed live at normal speed in one unbroken recording, takes fifteen seconds or less | Drop to two look-ups |
| **V11, new** | Whether a booking can exist before a quote is accepted. If it can, the second caller could be a prospect after all | No change. The existing-customer version is correct either way |

V6 (global search) and V9 (logo without the margin tagline) stand as before.

---

## 7. What is left to decide

1. **Approve the change of second caller** from a prospect to an existing customer
   with a booked job. This is the only alteration to the approved story.
2. **Approve the three final answer lines**, which now read the screen.
3. **Ask GEMIS to run V10**, the timed recording. It decides whether the film shows
   three look-ups or two, and it becomes the evidence behind the scene.
4. **Ask GEMIS to confirm V3**, the stock figure, which decides the same thing from
   the other side.

With those four answered, part one and this part two are the locked 45-second
script.
