# pwsandoval.github.io

Personal site built with **Hugo + PaperMod**, deployed automatically to **GitHub Pages** via Actions.

---

## 🧩 Local setup

Clone the repo (including the theme submodule):
```bash
git clone --recurse-submodules https://github.com/pwsandoval/pwsandoval.github.io.git
cd pwsandoval.github.io
# if already cloned:
# git submodule update --init --recursive
```

Install **Hugo Extended ≥ 0.146.0**

**macOS**
```bash
brew install hugo
```

**Linux**
```bash
wget https://github.com/gohugoio/hugo/releases/download/v0.151.0/hugo_extended_0.151.0_linux-amd64.deb
sudo dpkg -i hugo_extended_0.151.0_linux-amd64.deb
```

**Windows**
```bash
choco install hugo-extended
```

Run locally:
```bash
hugo server -D
```
Site available at → [http://localhost:1313](http://localhost:1313)

## 🚀 Deploy

Each push to **`main`** triggers an automatic build and deployment to **GitHub Pages**.  
The workflow uses a dynamic `--baseURL` provided by GitHub Pages.

## 🔄 Update the theme manually
```bash
git submodule update --remote --merge themes/PaperMod
git add themes/PaperMod
git commit -m "chore(theme): update PaperMod"
git push
```
