# 🌍 Dataset Translator - Outil de Traduction de Datasets Hugging Face

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)

**Traduisez n'importe quel dataset Hugging Face dans n'importe quelle langue**

[🇫🇷 Français](#-français) | [🇬🇧 English](#-english) | [🇨🇳 中文](#-中文)

</div>

---

## 🇫🇷 Français

### 📋 Table des Matières
- [À Propos](#-à-propos)
- [Fonctionnalités](#-fonctionnalités)
- [Installation](#-installation)
- [Utilisation](#-utilisation)
- [Méthodes de Traduction](#-méthodes-de-traduction)
- [Architecture](#-architecture)
- [Contribution](#-contribution)
- [Licence](#-licence)

### 🎯 À Propos

Dataset Translator est une application web moderne qui permet de traduire des datasets Hugging Face dans n'importe quelle langue. Face à la pénurie de données d'entraînement de qualité dans de nombreuses langues, cet outil democratise l'accès aux datasets multilingues pour la recherche en IA.

**Problème résolu :**
- La majorité des datasets de qualité sont en anglais ou chinois
- Les modèles de langage performants nécessitent des données dans la langue cible
- Les chercheurs et développeurs non-anglophones ont besoin de datasets dans leur langue

**Solution :**
- Interface intuitive pour traduire n'importe quel dataset public
- Streaming en temps réel pour gérer les gros datasets
- Plusieurs méthodes de traduction (API, LLM, modèles locaux)
- Upload automatique sur Hugging Face

### ✨ Fonctionnalités

#### 🔍 Recherche et Découverte
- Recherche en temps réel sur Hugging Face
- Autocomplétion avec aperçu des datasets
- Détection automatique des colonnes traduisibles
- Prévisualisation des données avant traduction

#### 🌐 Méthodes de Traduction
1. **API de traduction** (MyMemory) - Gratuit, sans clé API
2. **LLM via API** (OpenAI-compatible) - Haute qualité, configurable
3. **Modèles locaux** - Fonctionne hors ligne, respectueux de la vie privée
4. **Modèles avancés** - Meilleure qualité, plus lent

#### ⚡ Performance
- **Streaming parallèle** : Téléchargement et traduction simultanés
- **Pipeline optimisé** : Producteur-consommateur avec buffer
- **Gestion du rate limiting** : Retry automatique avec backoff exponentiel
- **Mémoire optimisée** : Traitement par batches de 100 lignes

#### 🎨 Interface Utilisateur
- Design "Liquid Glass" moderne et élégant
- Thème clair/sombre automatique
- Support multilingue (6 langues)
- Prévisualisation en temps réel des traductions
- Historique complet des traductions

#### 🔒 Sécurité et Confidentialité
- Tokens chiffrés et sauvegardés localement
- Aucun envoi de données vers des serveurs tiers (sauf API de traduction)
- Option de traduction 100% locale

### 🚀 Installation

#### Prérequis
- Node.js 18+ 
- npm ou yarn
- (Optionnel) Token Hugging Face pour l'upload

#### Étapes d'installation

```bash
# Cloner le repository
git clone https://github.com/votre-username/dataset-translator.git
cd dataset-translator

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

L'application sera accessible sur `http://localhost:5173`

### 📖 Utilisation

#### 1. Rechercher un Dataset
- Allez dans l'onglet "Translator"
- Tapez le nom d'un dataset (ex: "glue", "squad", "imdb")
- Sélectionnez un dataset dans les résultats
- Les colonnes sont détectées automatiquement

#### 2. Configurer la Traduction
- Choisissez la langue cible
- Sélectionnez les colonnes à traduire
- Choisissez la méthode de traduction
- (Optionnel) Limitez le nombre de lignes

#### 3. Lancer la Traduction
- Cliquez sur "Start Translation"
- Suivez la progression en temps réel
- Prévisualisez les traductions
- Téléchargez le résultat ou uploadez sur HF

#### 4. Gérer l'Historique
- Consultez toutes vos traductions
- Reprenez une traduction interrompue
- Uploadez un dataset déjà traduit

### 🔄 Méthodes de Traduction

#### API de Traduction (MyMemory)
- **Avantages** : Gratuit, rapide, pas de configuration
- **Inconvénients** : Qualité variable, rate limiting
- **Usage** : Tests rapides, petits datasets

#### LLM via API (OpenAI-compatible)
- **Avantages** : Excellente qualité, configurable
- **Inconvénients** : Payant, nécessite une clé API
- **Usage** : Datasets de production, haute qualité requise
- **Configuration** :
  - Endpoint API
  - Modèle (gpt-4o-mini, gpt-4o, etc.)
  - RPM (requests per minute)
  - Concurrence

#### Modèles Locaux
- **Avantages** : Gratuit, privé, hors ligne
- **Inconvénients** : Qualité limitée, plus lent
- **Usage** : Données sensibles, pas de connexion internet
- **Modèles** :
  - Small (<500M paramètres) - Rapide
  - Best (Helsinki-NLP) - Meilleure qualité

### 🏗️ Architecture

```
src/
├── components/         # Composants UI réutilisables
├── pages/             # Pages principales
│   ├── MainPage.tsx   # Page d'accueil
│   ├── TranslatorPage.tsx  # Interface de traduction
│   └── HistoryPage.tsx     # Historique
├── store.ts           # État global (Zustand)
├── i18n.ts            # Traductions (6 langues)
└── App.tsx            # Composant racine
```

**Technologies utilisées :**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Zustand (state management)
- Lucide React (icônes)

### 🤝 Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. Créez une **branche** (`git checkout -b feature/AmazingFeature`)
3. **Commit** vos changements (`git commit -m 'Add AmazingFeature'`)
4. **Push** vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une **Pull Request**

#### Idées d'amélioration
- Support de plus de méthodes de traduction
- Traduction batch pour plus de performance
- Interface de fine-tuning de modèles
- Support de formats de datasets supplémentaires
- Intégration avec d'autres plateformes (ModelScope, etc.)

### 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🇬🇧 English

### 📋 Table of Contents
- [About](#-about-1)
- [Features](#-features-1)
- [Installation](#-installation-1)
- [Usage](#-usage-1)
- [Translation Methods](#-translation-methods-1)
- [Architecture](#-architecture-1)
- [Contributing](#-contributing)
- [License](#-license-1)

### 🎯 About

Dataset Translator is a modern web application that allows you to translate Hugging Face datasets into any language. Facing the shortage of quality training data in many languages, this tool democratizes access to multilingual datasets for AI research.

**Problem solved:**
- Most quality datasets are in English or Chinese
- High-performance language models require data in the target language
- Non-English-speaking researchers and developers need datasets in their language

**Solution:**
- Intuitive interface to translate any public dataset
- Real-time streaming to handle large datasets
- Multiple translation methods (API, LLM, local models)
- Automatic upload to Hugging Face

### ✨ Features

#### 🔍 Search and Discovery
- Real-time search on Hugging Face
- Autocomplete with dataset preview
- Automatic detection of translatable columns
- Data preview before translation

#### 🌐 Translation Methods
1. **Translation API** (MyMemory) - Free, no API key required
2. **LLM via API** (OpenAI-compatible) - High quality, configurable
3. **Local Models** - Works offline, privacy-friendly
4. **Advanced Models** - Better quality, slower

#### ⚡ Performance
- **Parallel Streaming**: Simultaneous download and translation
- **Optimized Pipeline**: Producer-consumer with buffer
- **Rate Limiting Management**: Automatic retry with exponential backoff
- **Memory Optimized**: Processing in batches of 100 rows

#### 🎨 User Interface
- Modern and elegant "Liquid Glass" design
- Automatic light/dark theme
- Multilingual support (6 languages)
- Real-time translation preview
- Complete translation history

#### 🔒 Security and Privacy
- Encrypted tokens saved locally
- No data sent to third-party servers (except translation APIs)
- Option for 100% local translation

### 🚀 Installation

#### Prerequisites
- Node.js 18+
- npm or yarn
- (Optional) Hugging Face token for upload

#### Installation Steps

```bash
# Clone the repository
git clone https://github.com/your-username/dataset-translator.git
cd dataset-translator

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
```

The application will be accessible at `http://localhost:5173`

### 📖 Usage

#### 1. Search for a Dataset
- Go to the "Translator" tab
- Type a dataset name (e.g., "glue", "squad", "imdb")
- Select a dataset from the results
- Columns are automatically detected

#### 2. Configure Translation
- Choose the target language
- Select columns to translate
- Choose the translation method
- (Optional) Limit the number of rows

#### 3. Start Translation
- Click "Start Translation"
- Follow real-time progress
- Preview translations
- Download the result or upload to HF

#### 4. Manage History
- View all your translations
- Resume an interrupted translation
- Upload an already translated dataset

### 🔄 Translation Methods

#### Translation API (MyMemory)
- **Advantages**: Free, fast, no configuration
- **Disadvantages**: Variable quality, rate limiting
- **Use case**: Quick tests, small datasets

#### LLM via API (OpenAI-compatible)
- **Advantages**: Excellent quality, configurable
- **Disadvantages**: Paid, requires API key
- **Use case**: Production datasets, high quality required
- **Configuration**:
  - API endpoint
  - Model (gpt-4o-mini, gpt-4o, etc.)
  - RPM (requests per minute)
  - Concurrency

#### Local Models
- **Advantages**: Free, private, offline
- **Disadvantages**: Limited quality, slower
- **Use case**: Sensitive data, no internet connection
- **Models**:
  - Small (<500M parameters) - Fast
  - Best (Helsinki-NLP) - Better quality

### 🏗️ Architecture

```
src/
├── components/         # Reusable UI components
├── pages/             # Main pages
│   ├── MainPage.tsx   # Home page
│   ├── TranslatorPage.tsx  # Translation interface
│   └── HistoryPage.tsx     # History
├── store.ts           # Global state (Zustand)
├── i18n.ts            # Translations (6 languages)
└── App.tsx            # Root component
```

**Technologies used:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (animations)
- Zustand (state management)
- Lucide React (icons)

### 🤝 Contributing

Contributions are welcome! Here's how to participate:

1. **Fork** the project
2. Create a **branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. Open a **Pull Request**

#### Improvement Ideas
- Support for more translation methods
- Batch translation for better performance
- Model fine-tuning interface
- Support for additional dataset formats
- Integration with other platforms (ModelScope, etc.)

### 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🇨🇳 中文

### 📋 目录
- [关于](#-关于-1)
- [功能特性](#-功能特性-1)
- [安装](#-安装-1)
- [使用方法](#-使用方法-1)
- [翻译方法](#-翻译方法-1)
- [架构](#-架构-1)
- [贡献](#-贡献-1)
- [许可证](#-许可证-1)

### 🎯 关于

Dataset Translator 是一个现代化的 Web 应用程序，允许您将 Hugging Face 数据集翻译成任何语言。面对许多语言中高质量训练数据的短缺，这个工具为 AI 研究提供了多语言数据集的民主化访问。

**解决的问题：**
- 大多数高质量数据集都是英文或中文
- 高性能语言模型需要目标语言的数据
- 非英语研究人员和开发者需要母语的数据集

**解决方案：**
- 直观的界面翻译任何公开数据集
- 实时流式处理大型数据集
- 多种翻译方法（API、LLM、本地模型）
- 自动上传到 Hugging Face

### ✨ 功能特性

#### 🔍 搜索和发现
- Hugging Face 实时搜索
- 数据集预览自动完成
- 自动检测可翻译列
- 翻译前数据预览

#### 🌐 翻译方法
1. **翻译 API**（MyMemory）- 免费，无需 API 密钥
2. **通过 API 的 LLM**（OpenAI 兼容）- 高质量，可配置
3. **本地模型** - 离线工作，保护隐私
4. **高级模型** - 质量更好，速度较慢

#### ⚡ 性能
- **并行流式处理**：同时下载和翻译
- **优化管道**：带缓冲的生产者-消费者模式
- **速率限制管理**：带指数退避的自动重试
- **内存优化**：按 100 行批次处理

#### 🎨 用户界面
- 现代优雅的"液态玻璃"设计
- 自动明暗主题
- 多语言支持（6 种语言）
- 实时翻译预览
- 完整的翻译历史

#### 🔒 安全和隐私
- 加密令牌本地保存
- 不向第三方服务器发送数据（翻译 API 除外）
- 100% 本地翻译选项

### 🚀 安装

#### 先决条件
- Node.js 18+
- npm 或 yarn
- （可选）用于上传的 Hugging Face 令牌

#### 安装步骤

```bash
# 克隆仓库
git clone https://github.com/your-username/dataset-translator.git
cd dataset-translator

# 安装依赖
npm install

# 在开发模式下运行
npm run dev

# 为生产环境构建
npm run build
```

应用程序将在 `http://localhost:5173` 可访问

### 📖 使用方法

#### 1. 搜索数据集
- 转到"Translator"选项卡
- 输入数据集名称（例如："glue"、"squad"、"imdb"）
- 从结果中选择数据集
- 列会自动检测

#### 2. 配置翻译
- 选择目标语言
- 选择要翻译的列
- 选择翻译方法
- （可选）限制行数

#### 3. 开始翻译
- 点击"Start Translation"
- 跟踪实时进度
- 预览翻译
- 下载结果或上传到 HF

#### 4. 管理历史
- 查看所有翻译
- 恢复中断的翻译
- 上传已翻译的数据集

### 🔄 翻译方法

#### 翻译 API（MyMemory）
- **优点**：免费、快速、无需配置
- **缺点**：质量不稳定、速率限制
- **使用场景**：快速测试、小型数据集

#### 通过 API 的 LLM（OpenAI 兼容）
- **优点**：质量优秀、可配置
- **缺点**：付费、需要 API 密钥
- **使用场景**：生产数据集、需要高质量
- **配置**：
  - API 端点
  - 模型（gpt-4o-mini、gpt-4o 等）
  - RPM（每分钟请求数）
  - 并发数

#### 本地模型
- **优点**：免费、私密、离线
- **缺点**：质量有限、较慢
- **使用场景**：敏感数据、无网络连接
- **模型**：
  - Small（<500M 参数）- 快速
  - Best（Helsinki-NLP）- 质量更好

### 🏗️ 架构

```
src/
├── components/         # 可重用的 UI 组件
├── pages/             # 主页面
│   ├── MainPage.tsx   # 主页
│   ├── TranslatorPage.tsx  # 翻译界面
│   └── HistoryPage.tsx     # 历史记录
├── store.ts           # 全局状态（Zustand）
├── i18n.ts            # 翻译（6 种语言）
└── App.tsx            # 根组件
```

**使用的技术：**
- React 18 + TypeScript
- Vite（构建工具）
- Tailwind CSS（样式）
- Framer Motion（动画）
- Zustand（状态管理）
- Lucide React（图标）

### 🤝 贡献

欢迎贡献！以下是参与方式：

1. **Fork** 项目
2. 创建**分支**（`git checkout -b feature/AmazingFeature`）
3. **提交**您的更改（`git commit -m 'Add AmazingFeature'`）
4. **推送**到分支（`git push origin feature/AmazingFeature`）
5. 打开**Pull Request**

#### 改进想法
- 支持更多翻译方法
- 批量翻译以提高性能
- 模型微调界面
- 支持额外的数据集格式
- 与其他平台集成（ModelScope 等）

### 📄 许可证

本项目根据 MIT 许可证授权 - 有关详细信息，请参阅 [LICENSE](LICENSE) 文件。

---

<div align="center">

**Made with ❤️ for the multilingual AI community**

[⬆ Back to top](#-dataset-translator---outil-de-traduction-de-datasets-hugging-face)

</div>
