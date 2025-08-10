# Create a portable setup script for installing Rust (rustup, cargo, rustc) on GitHub Codespaces or most Linux/macOS hosts.
# The script detects the package manager, installs build tools, and installs rustup non-interactively.
# It also pins the stable toolchain and adds clippy and rustfmt, then prints versions.

from pathlib import Path
script = r"""#!/usr/bin/env bash
set -euo pipefail

echo "==> Detecting OS and package manager..."
PM=""
if command -v apt-get >/dev/null 2>&1; then
  PM="apt"
elif command -v dnf >/dev/null 2>&1; then
  PM="dnf"
elif command -v yum >/dev/null 2>&1; then
  PM="yum"
elif command -v pacman >/dev/null 2>&1; then
  PM="pacman"
elif command -v apk >/dev/null 2>&1; then
  PM="apk"
elif command -v brew >/dev/null 2>&1; then
  PM="brew"
else
  echo "Could not detect a supported package manager. You may need to install build tools manually."
fi

install_pkgs() {
  case "$PM" in
    apt)
      sudo apt-get update -y
      sudo apt-get install -y --no-install-recommends \
        build-essential curl ca-certificates git pkg-config libssl-dev cmake
      ;;
    dnf)
      sudo dnf install -y @development-tools curl git pkgconfig openssl-devel cmake
      ;;
    yum)
      sudo yum groupinstall -y "Development Tools"
      sudo yum install -y curl git pkgconfig openssl-devel cmake
      ;;
    pacman)
      sudo pacman -Sy --noconfirm base-devel curl git pkgconf openssl cmake
      ;;
    apk)
      sudo apk add --no-cache build-base curl git pkgconf openssl-dev cmake
      ;;
    brew)
      brew update
      brew install curl git pkg-config openssl@3 cmake
      ;;
    *)
      echo "Skipping system package install (unknown PM)."
      ;;
  esac
}

echo "==> Installing system build tools..."
install_pkgs

# Choose a shell rc file to append PATH sourcing
detect_rc() {
  if [ -n "${ZSH_VERSION:-}" ]; then
    echo "$HOME/.zshrc"
  elif [ -n "${BASH_VERSION:-}" ]; then
    echo "$HOME/.bashrc"
  else
    # default for Codespaces is bash
    echo "$HOME/.bashrc"
  fi
}

RC_FILE=$(detect_rc)

# Install rustup (Rust toolchain installer) if not present
if ! command -v rustup >/dev/null 2>&1; then
  echo "==> Installing rustup (Rust toolchain manager)..."
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
else
  echo "==> rustup already installed, updating..."
  rustup self update || true
fi

# Ensure cargo is on PATH for current session and future sessions
export PATH="$HOME/.cargo/bin:$PATH"
if ! grep -q 'export PATH="$HOME/.cargo/bin:$PATH"' "$RC_FILE" 2>/dev/null; then
  echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> "$RC_FILE"
fi

echo "==> Installing stable toolchain + components (rustfmt, clippy)..."
rustup toolchain install stable --component rustfmt clippy
rustup default stable

echo "==> Versions:"
rustc --version
cargo --version
rustup --version

echo "==> Success. Open a new terminal or 'source' your shell rc to refresh PATH:"
echo "     source \"$RC_FILE\""
"""

path = Path("/mnt/data/setup_rust.sh")
path.write_text(script, encoding="utf-8")
path.chmod(0o755)
print(str(path))
