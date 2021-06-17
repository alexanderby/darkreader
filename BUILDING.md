# Building Dark Reader

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Microsoft Windows instructions

_Microsoft Windows 7 or later is required_

### Installing prerequisites via chocolatey

1. Follow the installation steps on [chocolatey.org/install](https://chocolatey.org/install).

2. After installing chocolatey, execute this script below to install the packages required.

```ps1
choco install nodejs git
```

### Installing prerequisites via scoop

_Requirements for scoop is listed at [lukesampson/scoop#requirements](https://github.com/lukesampson/scoop#requirements)_

1. Follow the installation steps on [lukesampson/scoop#installation](https://github.com/lukesampson/scoop#installation).

2. After installing, execute this scrpt below to install the packges.

```ps1
scoop install nodejs git
```

## macOS instructions

_macOS Mojave (10.14) or later is required_

### Installing prerequisites via Homebrew

1. Follow the installation steps on [brew.sh](https://brew.sh/).  _(Skip this step if you already have homebrew)_
 
2. After installing homebrew, execute this script below in a terminal to install the packages.

```sh
brew install node git
```

## Linux instructions

### Installing prerequisites via built-in package managers

| Distribution         | Command                                        | Package Manager                                               |
|----------------------|------------------------------------------------|---------------------------------------------------------------|
| Arch Linux / Manjaro | `sudo pacman -S nodejs git`                    | [`pacman`](https://wiki.archlinux.org/title/Pacman)           |
| CentOS / RHEL        | `sudo yum install nodejs git`                  | [`yum`](https://en.wikipedia.org/wiki/Yum_(software))         |
| Debian / Ubuntu      | `sudo apt install nodejs git`                  | [`apt`](https://en.wikipedia.org/wiki/APT_(software))         |
| Fedora               | `sudo dnf install nodejs git`                  | [`dnf`](https://docs.fedoraproject.org/en-US/quick-docs/dnf/) |
| Gentoo               | `emerge net-libs/nodejs dev-vcs/git`           | [`portage`](https://wiki.gentoo.org/wiki/Portage)             |