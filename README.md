# 🎮 TTG Quasar Application

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/your-repo/ttg-quasar)
[![Security Status](https://img.shields.io/badge/security-production%20ready-green)](docs/security/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D)](https://vuejs.org/)
[![Quasar](https://img.shields.io/badge/Quasar-2.18.2-1976D2)](https://quasar.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.1.0-FFCA28)](https://firebase.google.com/)

> **Production-ready tabletop gaming platform built with Vue 3, Quasar Framework, and Firebase**

## 🎯 **Overview**

The TTG (Tabletop Gaming) Quasar Application is a comprehensive, enterprise-grade web application that provides a complete platform for managing tabletop gaming events, players, games, and community interactions.

### ✨ **Key Features**

- 🔐 **Secure Authentication** - Firebase Auth with role-based access control
- 🎮 **Game Management** - Comprehensive game catalog and ownership tracking
- 📅 **Event Management** - Event creation, RSVP, and calendar integration
- 👥 **Player Management** - User profiles, preferences, and social features
- 💬 **Messaging System** - Real-time messaging between players
- 📊 **Admin Dashboard** - Complete administrative interface
- 🌐 **Internationalization** - Multi-language support (English/Spanish)
- 📱 **Responsive Design** - Mobile-first, PWA-ready
- 🛡️ **Enterprise Security** - Production-ready security implementation

## 🚀 **Quick Start**

### Prerequisites

- Node.js 24 LTS (recommended), or a supported even-numbered release starting at 22.22.0
- npm or yarn
- Firebase CLI
- Git

GitHub Actions tests Node.js 22.22+ and 24, builds and deploys with Node.js 24,
and uses Ubuntu 24.04 runners.

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ttg-quasar

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your Firebase configuration

# Start development server
npm run dev
```

### Build & Deploy

```bash
# Run tests
npm run test

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

`npm run build` first checks public assets and refuses to publish private keys.
Firebase Admin service-account files must stay outside `public/`; use environment
credentials for server-side tooling. If a key has been uploaded or deployed,
revoke it in Google Cloud IAM before deploying again.

## 🔒 **Security Status**

### ✅ **Production Ready Security**

- **Critical Vulnerabilities**: 0 (Fixed from 3)
- **Security Score**: 9/10 (Improved from 2/10)
- **Test Coverage**: 479 tests passing (100% pass rate)
- **TypeScript**: Strict mode with zero compilation errors

## 📚 **Documentation**

| Document                                                       | Description                        | Status      |
| -------------------------------------------------------------- | ---------------------------------- | ----------- |
| [Project Overview](docs/PROJECT_OVERVIEW.md)                   | High-level project information     | ✅ Complete |
| [API Documentation](docs/API_DOCUMENTATION.md)                 | Complete API reference             | ✅ Complete |
| [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)                   | Production deployment instructions | ✅ Complete |
| [Development Roadmap](docs/development/DEVELOPMENT_ROADMAP.md) | Future development plans           | ✅ Complete |
| [Security Documentation](docs/security/)                       | Security implementation details    | ✅ Complete |

## 🛠️ **Development**

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run dev:pwa          # Start PWA development server

# Building
npm run build            # Build for production
npm run build:pwa        # Build PWA for production

# Testing
npm run test             # Run unit tests
npm run test:coverage    # Run tests with coverage
npm run test:security    # Run security tests

# Linting
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors

# Firebase
firebase serve           # Serve locally with Firebase
firebase deploy          # Deploy to Firebase
```

## 🔮 **Roadmap**

### Phase 2: Feature Enhancement (Weeks 1-12)

- Enhanced UI/UX components
- Advanced game management
- Improved event management
- Community features

See [Development Roadmap](docs/development/DEVELOPMENT_ROADMAP.md) for detailed plans.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Status**: ✅ **PRODUCTION READY**  
**Security Level**: **ENTERPRISE GRADE**  
**Version**: 2.0  
**Last Updated**: December 2024

# [[Community Game Night]]

A series of regularly scheduled game nights primarily hosted at the [[Recreation Building]].
Multiple games can be run by members or organizers at the same time within the space.

## 📃Contents

- [[#📃Contents]]
- [[#👨‍🏫 How it Works]]
  - [[#👥 Attendees & Organizers]]
  - [[#📅 Schedule]]
- [[#🎲 Game Sessions]]
  - [[#👨‍👩‍👧‍👦 Family Game Night]]
  - [[#🧑‍🤝‍🧑Adult Game Night]]
  - [[#🌟 Special Events]]
- [[#📔 Game Library]]
  - [[#♟️ Tabletop Games]]
  - [[#🎮 Video games]]
- [[#💻 Promotion & Engagement]]
  - [[#👨‍💻 Table-Top Gaming Website]]
    - [[#⚙️ Advanced Features]]
  - [[#💬 Social Media]]
    - [[#🗣️ Discord]]
    - [[#🤢 Facebook]]
  - [[#📚 QR Codes]]
- [[#🤔 Considerations]]
  - [[#💰Cost]]
  - [[#😨 Social Anxiety]]
  - [[#👩‍👧‍👦 Unattended Minors]]
  - [[#🙋‍♂️ Guests and Non-member Attendees]]
  - [[#🍎 Refreshments]]
  - [[#🚕 Transportation]]
  - [[#🛡️ Safety & Security]]
    - [[#🍷 Drugs & Alcohol]]
  - [[#🎰 Gambling]]
  - [[#🔏 Privacy]]
- [[#🧠 Brainstorm]]

## 👨‍🏫 How it Works

Each Game Night should include some form of:

- At least one [[#👥 Attendees & Organizers|Organizer of Attendee]] offering a "Learn to play"
- One scheduled "Official Game" of the night
- Access to a library of "permanent" games
- Free space for Members to play games they choose to bring
- Optional: Some prize or achievement system to attendees
  - Nothing Expensive: A copy of a game or stickers or any number of other options.
  - Use as a sort of Intermittent Reward for Attendance and to encourage Engaging with other

### 👥 Attendees & Organizers

**Community Resident**: Someone who resides in Conashaugh Lakes and has an assigned **Member Badge**.

**Organizers**: most likely [[Recreation Committee]] volunteers.
(_Initially, this will most certainly include me for most game sessions_)

**Attendees**: any Community Resident present at Game Night for the purpose of play.

**[[#🙋‍♂️ Guests and Non-member Attendees|Guests]]**: **Non-resident** attendees brought as guests by Community Residents.
This should be allowed, even encouraged.

(See Also: [[#👩‍👧‍👦 Unattended Minors]])

### 📅 Schedule

Ideally Gaming Sessions should be run more than once a month in order to retain attendees and allow for members with restrictive schedules more opportunities to attend. Consistency and frequency will be key to sustained attendance.

(_I intend for General game sessions to be held bi-weekly to retain attendance._)

Members should be able to expect other members and games to play.

Community Game Nights could be the only access a members has to a favorite game or steady group of players.

More varieties of Game Night sessions can be organized as attendance and interest grows. Examples include:

- [[#👨‍👩‍👧‍👦 Family Game Night]]: Standard Mix of organized and free-play every other Saturday
- [[#🧑‍🤝‍🧑Adult Game Night]]: Mix of free and organized play every other Friday
- Dungeons and Dragons campaign: third Sunday of the Month (_Seeking new party members_)
- Official CLCA Annual Community Poker Tournament

## 🎲 Game Sessions

### 👨‍👩‍👧‍👦 Family Game Night

Family-friendly game sessions.
Individual members will be allowed to attend as well, not just families. Room for solo or closed group play.

Members will be encouraged to:

- bring their favorite games to play with others
- teach new games to other members
- learn new games other members may bring

### 🧑‍🤝‍🧑Adult Game Night

Some sessions could be devoted to more mature players, while family-friendly sessions can include all ages.

### 🌟 Special Events

- Social Deduction games (Werewolf and [Mafia](<https://en.wikipedia.org/wiki/Mafia_(party_game)>)) could be run similarly to the Murder Mystery Night. (Decorations, Costumes, etc.)
- Multicultural Game Night for games with significant history and cultural origins
- Long-form Tournaments

## 📔 Game Library

### ♟️ Tabletop Games

Modern and contemporary tabletop board and card games.
During Lockdown, Tabletop Gaming has a bit of a renaissance, with many new and innovative games being released and discovered.

> Current [[Game List]]
> (_Willing to donate some board/card games to permanently be stored at the [[Recreation Building]]_)

### 🎮 Video games

Setup consoles for multiplayer in the [[Recreation Building]].
Wifi & TV in Rec Building?
"LAN parties"?

## 💻 Promotion & Engagement

While traditional methods of advertisement will certainly be useful, more modern tools should also be considered.

One benefit of focusing on **Family** game night, is the increased likelihood a member of the family will be technologically competent enough to use at least one of these tools.

### 📰 Traditional Advertising

Advertise regularly using traditional advertising methods: Printed Flyers, Bulletin Boards, Conashaugh Courier, Word of Mouth

### 👨‍💻 Table-Top Gaming Website

_This topic will require it's own in-depth discussions, but roughly:_
Website/Mobile Application built to track and manage calendar or game night sessions, inventory, members, and attendance.

Attendees and Organizers would ideally have separate interfaces with varying levels of complexity; with general Attendees accessing a simplified portal.

Key features include:

- Event Calendar and RSVP system to (_roughly_) show attendance and game availability
- Members' can organize and offer access to private and public Game libraries
- Administrative Tools

Members can:

- view and rsvp to upcoming gaming sessions
- browse members' public game lists and express interest
- list games they own and are willing to bring
- specifically request a game for a future session

#### ⚙️ Advanced Features

Information is stored in Google Firebase, a free external database system.
The website has already been designed to allow for external systems to access the data stored. Can be used to create many different interfaces across multiple websites/services.
(_For example: Hypothetically, The Courier website could have it's own Community Event calendar, and pull data from Google Firebase to display the list of upcoming Game Sessions automatically without having to enter the data twice._)

Events can be exported for popular calendar systems like Google Calendar so members can use their own preferred system for notifications and reminders.

[[#🏁 QR Codes|QR Codes]] and Bar Codes can be scanned to direct savvy members to website and individual game pages.

Designed with a Web Interface, but can also be compiled into a mobile application, though that would most likely be unnecessarily complex for this use case.

### 💬 Social Media

Beyond the tools listed below, one benefit to utilizing and encouraging social media usage is that Attendees can share their experiences organically. Posting images and videos of memorable moments from a game will naturally encourage others to attend.

#### 🗣️ [[Discord]]

[Discord](https://discord.com/) is a popular and trusted social media application for small groups to organize and engage.

A self-managed and self-contained forum and chat system with a variety of tools for promoting events and engaging in conversation.

Experienced volunteers can be promoted to moderate and help organize the server.

A Work-in-progress version of a [Tabletop Gaming discord server](https://discord.gg/YMD9bkzFYc) can be seen here:
https://discord.gg/YMD9bkzFYc

#### 🤢 Facebook

Ick, but probably a necessary tool for promotion/engagement.
Someone will likely have to volunteer to manage. (_Not it. 👉👃_)

### 🏁 QR Codes

QR codes can be used by [[#👥 Attendees & Organizers]] to quickly send and received data from the [[#👨‍💻 Table-Top Gaming Website]]. This has the benefit of tracking usage statistics.

Scanning the QR code can be used as part of a library system for checking games in and out. This is already implemented to some degree within the website's code.

A check-in/check-out checklist can be helpful for ensuring pieces are returned to box at the end of each session.

- Printing QR Codes as stickers can be attached to game boxes
- Laminated cards inserted into game box
- Manually managed without QR through website/app

## 🤔 Considerations

### 💰Cost

I expect individual events to have minimal costs. Inventory will primarily be provided by [[#👥 Attendees & Organizers]].

Fund Raising & Donations can help subsidize new games or expansions.

### 😨 Social Anxiety

By allowing interested members to see a rough idea of which games are available, what they should bring, who's attending, it can help mitigate the anxiety of walking into an unknown situation.

### 👩‍👧‍👦 Unattended Minors

A concern to be discussed on how to manage minors and verify they are supervised by a responsible adult. A minor's ability to attend being limited by **requiring** an adult to attend as well could severely impact attendance.

- What are liability considerations?
- How much responsibility are organizers willing to take?
- Fear vs legitimate concerns?
- Does the ratio of adult to minor need to be 1:1?

### 🙋‍♂️ Guests and Non-member Attendees

A question of if and how guests of Community Members from outside the community can or should be allowed to attend. I would 100% recommend YES, and the how can be left to the Member inviting the guest.

### 🍎 Refreshments

### 🚕 Transportation

### 🛡️ Safety & Security

Some game sessions have been known to get heated.

#### 🍷 Drugs & Alcohol

Prohibited by default. Almost certainly covered by Conashaugh or Recreation Committee's rules and regulations.

### 🎰 Gambling

While this would be prohibited in most cases, there are times games of chance can be used by institutions for fund-raising. Worth investigating.

### 🔏 Privacy

Rules for image and video recording should be established.
I think members sharing media could be a big source of interest leading to new Attendees.
However, I'm sure I'm not alone in having ZERO desire to have my image posted online, especially without consent.

## 🧠 Brainstorm

- Thursday nights so they can talk about it at work/school the next day
- Based on popularity of particular games, multiple nights or locations may be possible
- [[Battlehammer Games]], a local game store can teach members
- Charity and Fundraising events
