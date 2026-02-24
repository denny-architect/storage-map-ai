# AI Storage Map - Project Status

> **Live Site:** https://denny-architect.github.io/storage-map-ai/  
> **Repository:** https://github.com/denny-architect/storage-map-ai  
> **Last Updated:** February 24, 2026

---

## ✅ What We've Completed

### Core Content & Structure
- **Landing page** with animated gradient hero, bold tagline, and four pipeline cards
- **Four deep-dive pages** (Training, RAG, Fine-Tuning, Inference) each containing:
  - Plain-English definitions
  - Custom SVG pipeline diagrams
  - Phase-by-phase walkthroughs with S3 path examples
  - I/O profile summary tables
  - "Bottom Line" callouts
- **Comparison Matrix** — interactive table showing storage role across all workloads
- **S3 Paths Reference** — comprehensive namespace guide with best practices
- **Glossary** — 25+ searchable AI/ML terms with definitions and related terms
- **Demo Stack page** — APOD RAG architecture mapping (Ollama, Maxi, ClickHouse, CRC, Jupyter, Grafana, MinIO)

### Visual & UX Enhancements
- **Animated gradient hero** with grid overlay and scroll indicator
- **Storage intensity meters** on pipeline cards (100%, 75%, 45%, 20%)
- **MinIO role color-coding** throughout:
  - Raspberry (Primary storage)
  - Amber (Buffered read)
  - Blue (Burst read)
  - Gray (Not in path)
- **Horizontal flow diagrams** with arrow thickness reflecting data volume
- **Data Gravity infographic** — logarithmic-scale bar chart (PB → KB)
- **Myth-busting section** — 5 common misconceptions debunked
- **Scroll-aware sticky header** with backdrop blur
- **Responsive mobile navigation** with animated hamburger menu
- **Card lift effects**, hover glows, and shimmer animations

### Technical Stack
- React 19 + TypeScript
- Tailwind CSS v4
- Vite 7
- React Router 7
- GitHub Pages deployment via Actions workflow
- SPA routing fix (404.html redirect hack)

### Infrastructure
- GitHub repository configured
- CI/CD pipeline (`.github/workflows/deploy.yml`)
- Automatic deployment on push to `main`
- Base path configured for GitHub Pages subdirectory

---

## 🔲 What's Left To Do

### Content Gaps
- [ ] **Real screenshots** — Grafana dashboards, Jupyter notebooks, MinIO Console UI
- [ ] **Detailed throughput notes** — specific GB/s recommendations per workload
- [ ] **Inference anatomy diagram** — the 6-step GPU loop deserves its own SVG

### Missing from Design Brief
- [ ] **Interactive pipeline explorer** (optional/budget) — click-through animated flow
- [ ] **I/O profile simulator** (optional) — input your model size, get storage estimates

### Polish Items
- [ ] Mobile diagram scrolling could be smoother
- [ ] Some diagrams could use arrow thickness variation
- [ ] Code block styling consistency check across all pages

---

## 💡 Ideas for the Future

### High-Impact Additions

1. **Storage Calculator**
   - Input: model size, batch size, checkpoint frequency, training duration
   - Output: estimated storage requirements, throughput needs, cost projections
   - Would make the site genuinely useful as a planning tool

2. **Interactive Pipeline Explorer**
   - Animated data flow visualization
   - Click any node to see storage role, example paths, I/O patterns
   - Toggle between "training run" and "inference request" views

3. **Architecture Decision Tree**
   - "What's your workload?" → guided questions → recommended storage config
   - Outputs specific MinIO/S3 settings, bucket structure, lifecycle policies

4. **Real Benchmark Data**
   - Partner with MinIO to get actual throughput numbers
   - "140GB model loads in X seconds at Y GB/s"
   - Credibility through specificity

### Content Expansions

5. **Case Studies Section**
   - Real-world examples: "How Company X structures their training data lake"
   - Anonymous but specific — actual bucket counts, object sizes, throughput achieved

6. **Video Walkthroughs**
   - 2-3 minute explainers for each pipeline
   - Screen recordings of actual MinIO Console during training run

7. **Downloadable Assets**
   - PDF version of the storage map
   - Architecture diagram templates (Excalidraw, Figma)
   - Sample bucket policy JSONs

### Technical Enhancements

8. **Dark Mode Toggle**
   - The site has dark headers/footers — full dark mode would be natural

9. **Search Functionality**
   - Global search across all pages
   - "Where does checkpointing happen?" → jumps to relevant sections

10. **Comparison Tool**
    - Side-by-side diff view: "Training vs Fine-Tuning"
    - Highlight what's the same, what's different

11. **API/Embeddable Widgets**
    - Let others embed the pipeline diagrams
    - `<iframe>` or React component package

### Community & Engagement

12. **"Suggest an Edit" Links**
    - GitHub issue templates for corrections
    - Build credibility through transparency

13. **Newsletter/Updates**
    - "Storage patterns are evolving — subscribe for updates"
    - New model architectures = new storage patterns

14. **Certification Quiz**
    - Fun way to test understanding
    - "You scored 9/10 — you understand AI storage better than most!"

---

## 🏗️ Technical Debt

- Vite config has `allowedHosts: 'all'` — fine for dev, but noted
- Some components could be broken into smaller pieces
- TypeScript could be stricter (`strict: true` in tsconfig)
- No unit tests currently — adding Vitest would be smart

---

## 📊 Design Brief Compliance

| Requirement | Status |
|------------|--------|
| Landing hero with four pipeline cards | ✅ |
| Deep-dive pages per pipeline | ✅ |
| Definition + diagram + phase walkthrough | ✅ |
| S3 examples and MinIO role | ✅ |
| Comparison matrix | ✅ |
| Demo-stack page | ✅ |
| Horizontal flow diagrams | ✅ |
| Color-coded MinIO roles | ✅ |
| Clean sans-serif typography | ✅ |
| Code font for paths | ✅ |
| MinIO red accents | ✅ |
| Responsive layout | ✅ |
| Myth-busting section | ✅ |
| Data gravity infographic | ✅ |
| S3 path reference | ✅ |
| Throughput notes | ⚠️ Partial |
| Glossary | ✅ |
| Interactive explorer | ❌ Not yet |

---

## 🚀 Deployment Info

**To deploy changes:**
```bash
git add .
git commit -m "Your message"
git push origin main
```

GitHub Actions automatically:
1. Installs dependencies
2. Builds with Vite
3. Deploys to GitHub Pages

**Live in ~60 seconds** after push.

---

*Built with the goal of being the most technically accurate AI storage reference on the internet.*
