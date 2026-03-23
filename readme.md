# StudyBuddy

**Platforma za dijeljenje bilješki i grupno učenje**

---

## Opis projekta

StudyBuddy je moderna web aplikacija namijenjena srednjoškolcima i studentima koji žele učinkovitije učiti kroz dijeljenje, ocjenjivanje i organizaciju bilješki i materijala. Glavni problem koji rješava je sljedeći: svaki dan tisuće učenika pišu gotovo identične bilješke iz istih udžbenika i predavanja, ali te bilješke ostaju zaključane u njihovim bilježnicama, WhatsApp grupama ili Google Docsovima koji brzo postanu kaotični i nepregledni.

Cilj aplikacije je stvoriti centralizirano, jednostavno i besplatno mjesto gdje korisnici mogu brzo pronaći kvalitetne materijale, podijeliti svoje znanje s drugima, dobiti povratne informacije kroz komentare i ocjene te učiti interaktivno pomoću flashcardsa.

**Korisnici aplikacije:**
- Grupe za učenje i razredne zajednice
- Ciljna dob: 15–25 godina

**Zašto baš ova tema?**
U hrvatskom obrazovnom sustavu nedostaje jednostavna, besplatna i lokalizirana platforma za dijeljenje bilješki. Postojeće aplikacije poput Quizlet, Notion ili Google Classroom su ili previše općenite, ili plaćene, ili nemaju fokus na hrvatske predmete (Matematika, Hrvatski, Fizika, Kemija, Povijest, Engleski itd.). StudyBuddy je zamišljen kao studentski projekt koji rješava upravo taj problem — omogućuje dijeljenje unutar škole ili smjera, a istovremeno motivira korisnike kroz favorite i preglednost materijala.

**Tehnološki stog:**
- **SolidJS** (JavaScript ES6+) — reaktivno korisničko sučelje
- **TailwindCSS** — responzivan i prilagođen dizajn
- **Firebase** (Authentication, Firestore, Hosting) — autentifikacija, baza podataka, hosting
- **Vite** — build alat
- **Zod** — validacija formi
- **GitHub** — verzioniranje koda

---

## Tablica funkcionalnosti

### Osnovne mogućnosti

| Funkcionalnost | Status |
|---|---|
| Registracija korisnika (email) | ✅ Napravljeno |
| Prijava korisnika (email) | ✅ Napravljeno |
| Odjava korisnika | ✅ Napravljeno |
| Oporavak lozinke (email reset) | ✅ Napravljeno |
| Promjena lozinke u profilu | ✅ Napravljeno |
| Korisnički profil (pregled i uređivanje) | ✅ Napravljeno |
| Omiljeni predmeti na profilu | ✅ Napravljeno |
| Razlikovanje uloga (korisnik / admin) | ✅ Napravljeno |
| Kreiranje bilješki (naslov, sadržaj, predmet, tagovi) | ✅ Napravljeno |
| Označavanje bilješke kao javna / privatna | ✅ Napravljeno |
| Pregled vlastith bilješki | ✅ Napravljeno |
| Brisanje vlastith bilješki | ✅ Napravljeno |
| Pregled detalja bilješke | ✅ Napravljeno |
| Dashboard s najnovijim javnim bilješkama | ✅ Napravljeno |
| Filtriranje po predmetu na dashboardu | ✅ Napravljeno |
| Pretraga bilješki (predmet + ključna riječ) | ✅ Napravljeno |
| Označavanje bilješki kao favorit | ✅ Napravljeno |
| Admin panel — pregled i brisanje svih bilješki | ✅ Napravljeno |

### Napredne mogućnosti

| Funkcionalnost | Status |
|---|---|
| Komentari na bilješkama | ⏳ Nije napravljeno |
| Ocjenjivanje bilješki (1–5 zvjezdica) | ⏳ Nije napravljeno |
| Flashcards mod za učenje | ⏳ Nije napravljeno |
| Sustav bodova i rang-lista | ⏳ Nije napravljeno |
| Google prijava | ⏳ Nije napravljeno |

---

## Scenariji korištenja

**1. Novi korisnik**
Otvori aplikaciju → registrira se emailom → dobije potvrdu na email → prijavi se → vidi naslovnicu s javnim bilješkama → postavi profil s omiljenim predmetima.

**2. Kreiranje bilješke**
Prijavljen korisnik klikne „Nova bilješka" → odabere predmet → upiše naslov i sadržaj u Markdown editoru → dodaje tagove → označi javno/privatno → objavi bilješku.

**3. Traženje materijala**
Korisnik na naslovnici odabere predmet pill filter „Matematika" ili ode na Pretragu → upiše „derivacije" → otvori bilješku → pročita sadržaj → označi srce (favorit).

**4. Admin upravljanje**
Administrator se prijavi → u navbaru vidi „Admin" link → otvori admin panel → pregleda sve bilješke svih korisnika → može obrisati neprimjerenu bilješku.

**5. Promjena lozinke**
Korisnik ode na Profil → klikne „Promijeni lozinku" → unese trenutnu i novu lozinku → potvrdi → sustav reauthenticira i spremi novu lozinku.

---

## Struktura baze podataka (Firestore)

### Kolekcija `users`
```
{
  uid:              string,
  email:            string,
  displayName:      string,
  photoURL:         string,
  role:             "user" | "admin",
  favoriteSubjects: string[],
  createdAt:        string (ISO datum)
}
```

### Kolekcija `notes`
```
{
  userId:      string,       // UID autora
  authorName:  string,       // prikazno ime autora
  title:       string,       // naslov bilješke
  content:     string,       // sadržaj (Markdown)
  subject:     string,       // predmet
  isPublic:    boolean,      // javna ili privatna
  tags:        string[],     // ključne riječi
  favorites:   string[],     // UID-ovi korisnika koji su favorizirali
  createdAt:   Timestamp,
  updatedAt:   Timestamp
}
```

---

## Tehnologije

| Tehnologija | Svrha |
|---|---|
| SolidJS 1.9 | Reaktivni UI framework |
| Vite 7 | Build alat i dev server |
| TailwindCSS 4 | CSS framework |
| Firebase Auth | Autentifikacija korisnika |
| Firebase Firestore | NoSQL baza podataka |
| Firebase Hosting | Javni hosting aplikacije |
| Zod | Validacija formi |
| date-fns | Formatiranje datuma |

---

## Vizualni prototip

![StudyBuddy Prototip](/img/image1.jpg)

---

## Napredak po fazama

### ✅ Faza 1 — Planiranje (završena)
- Opisan projekt i ciljna skupina
- Definirana tablica funkcionalnosti
- Napisani scenariji korištenja
- Izrađen vizualni prototip

### ✅ Faza 2 — Priprema i osnovna funkcionalnost (završena)
- Inicijaliziran SolidJS + Vite projekt s TailwindCSS
- Spojen Firebase projekt (Auth + Firestore + Hosting)
- Implementirana registracija, prijava i odjava
- Implementiran oporavak i promjena lozinke
- Razlikovanje uloga korisnika — `user` i `admin`
- Korisnički profil s pregledom i uređivanjem podataka
- Modelirana Firestore baza (kolekcije `users` i `notes`)
- Postavljene Firestore sigurnosne regule i indeksi
- Implementiran cijeli CRUD za bilješke
- Responzivan dizajn (desktop + mobilni uređaji)
- Objavljena aplikacija na Firebase Hostingu

### ⏳ Faza 3 — Implementacija (u tijeku)
- Uređivanje postojećih bilješki
- Komentari i ocjenjivanje
- Flashcards mod