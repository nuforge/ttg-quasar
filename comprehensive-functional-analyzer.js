#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ComprehensiveFunctionalAnalyzer {
  constructor() {
    this.srcDir = path.join(__dirname, 'src');
    this.analysis = {
      stores: new Map(),
      components: new Map(),
      composables: new Map(),
      utilities: new Map(),
      services: new Map(),
      types: new Map(),
      models: new Map(),
      schemas: new Map(),
      functionalGroups: new Map(),
      architecturalIssues: [],
      redundancies: [],
      codeIslands: [],
      dataFlow: new Map(),
      responsibilities: new Map(),
      legacyReferences: [],
      legacyCandidates: [],
      unusedLegacy: [],
      importGraph: new Map(),
    };

    this.functionalCategories = {
      'theme-management': [],
      'persona-management': [],
      'tag-management': [],
      'chat-functionality': [],
      'story-management': [],
      'timeline-management': [],
      'ui-components': [],
      'data-persistence': [],
      'routing-navigation': [],
      'state-management': [],
      'utility-functions': [],
    };

    // Patterns indicating legacy (pre-ContentDoc) models/flows
    this.legacyIndicators = [
      /\bEventSubmission\b/,
      /\bGameSubmission\b/,
      /eventSubmissions\b/,
      /gameSubmissions\b/,
      /event-submission/i,
      /game-submission/i,
      /\bApproval\b|\bapprove\b|\bapproved\b/, // legacy approval workflow
    ];

    // Files that are known legacy by name
    this.legacyFileNameHints = [
      'EventSubmission.ts',
      'GameSubmission.ts',
      'event-submission-service.ts',
      'submission',
    ];
  }

  async analyze() {
    console.log('🏗️ Starting Comprehensive Functional Architecture Analysis...');
    console.log('='.repeat(60));

    try {
      await this.analyzeStores();
      await this.analyzeComponents();
      await this.analyzeComposables();
      await this.analyzeUtilities();
      await this.analyzeServices();
      await this.analyzeTypes();
      await this.analyzeModels();
      await this.analyzeSchemas();

      await this.identifyFunctionalGroups();
      await this.analyzeDataFlow();
      await this.findCodeIslands();
      await this.assessArchitecturalIssues();
      await this.buildImportGraph();
      await this.analyzeLegacyReferences();
      await this.findUnusedLegacy();

      const report = await this.generateComprehensiveReport();

      console.log('='.repeat(60));
      console.log('✅ Comprehensive Functional Architecture Analysis complete!');
      console.log(`📊 Analyzed ${this.getTotalFiles()} files`);
      console.log(`🔍 Found ${this.analysis.redundancies.length} redundancies`);
      console.log(`🏝️ Found ${this.analysis.codeIslands.length} code islands`);
      console.log(`⚠️ Found ${this.analysis.architecturalIssues.length} architectural issues`);

      return report;
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      throw error;
    }
  }

  async analyzeStores() {
    console.log('🏪 Analyzing Pinia stores...');

    const storeFiles = this.getAllFiles(this.srcDir, ['.ts']).filter(
      (f) => f.includes('stores') && !f.includes('__tests__'),
    );

    for (const storeFile of storeFiles) {
      const content = fs.readFileSync(storeFile, 'utf8');
      const storeName = path.basename(storeFile, '.ts');

      const analysis = {
        name: storeName,
        path: path.relative(this.srcDir, storeFile),
        responsibilities: this.extractStoreResponsibilities(content),
        state: this.extractStoreState(content),
        actions: this.extractStoreActions(content),
        getters: this.extractStoreGetters(content),
        dependencies: this.extractStoreDependencies(content),
        complexity: this.calculateComplexity(content),
        usage: new Set(),
      };

      this.analysis.stores.set(storeName, analysis);
      this.categorizeByFunctionality(storeName, analysis, 'store');
    }

    console.log(`📊 Analyzed ${storeFiles.length} stores`);
  }

  async analyzeComponents() {
    console.log('🧩 Analyzing Vue components...');

    const componentFiles = this.getAllFiles(this.srcDir, ['.vue']);

    for (const componentFile of componentFiles) {
      const content = fs.readFileSync(componentFile, 'utf8');
      const componentName = path.basename(componentFile, '.vue');

      const analysis = {
        name: componentName,
        path: path.relative(this.srcDir, componentFile),
        responsibilities: this.extractComponentResponsibilities(content),
        props: this.extractComponentProps(content),
        emits: this.extractComponentEmits(content),
        dependencies: this.extractComponentDependencies(content),
        templateComplexity: this.analyzeTemplateComplexity(content),
        scriptComplexity: this.analyzeScriptComplexity(content),
        usage: new Set(),
        isUsed: false,
      };

      this.analysis.components.set(componentName, analysis);
      this.categorizeByFunctionality(componentName, analysis, 'component');
    }

    console.log(`📊 Analyzed ${componentFiles.length} components`);
  }

  async analyzeComposables() {
    console.log('🔧 Analyzing composables...');

    const composableFiles = this.getAllFiles(this.srcDir, ['.ts']).filter(
      (f) => f.includes('composables') && !f.includes('__tests__'),
    );

    for (const composableFile of composableFiles) {
      const content = fs.readFileSync(composableFile, 'utf8');
      const composableName = path.basename(composableFile, '.ts');

      const analysis = {
        name: composableName,
        path: path.relative(this.srcDir, composableFile),
        responsibilities: this.extractComposableResponsibilities(content),
        exports: this.extractComposableExports(content),
        dependencies: this.extractComposableDependencies(content),
        complexity: this.calculateComplexity(content),
        usage: new Set(),
      };

      this.analysis.composables.set(composableName, analysis);
      this.categorizeByFunctionality(composableName, analysis, 'composable');
    }

    console.log(`📊 Analyzed ${composableFiles.length} composables`);
  }

  async analyzeUtilities() {
    console.log('🛠️ Analyzing utility functions...');

    const utilFiles = this.getAllFiles(this.srcDir, ['.ts']).filter(
      (f) => (f.includes('utils') || f.includes('lib')) && !f.includes('__tests__'),
    );

    for (const utilFile of utilFiles) {
      const content = fs.readFileSync(utilFile, 'utf8');
      const utilName = path.basename(utilFile, '.ts');

      const analysis = {
        name: utilName,
        path: path.relative(this.srcDir, utilFile),
        responsibilities: this.extractUtilityResponsibilities(content),
        exports: this.extractUtilityExports(content),
        dependencies: this.extractUtilityDependencies(content),
        complexity: this.calculateComplexity(content),
        usage: new Set(),
      };

      this.analysis.utilities.set(utilName, analysis);
      this.categorizeByFunctionality(utilName, analysis, 'utility');
    }

    console.log(`📊 Analyzed ${utilFiles.length} utilities`);
  }

  async analyzeServices() {
    console.log('🌐 Analyzing services...');

    const serviceFiles = this.getAllFiles(this.srcDir, ['.ts']).filter(
      (f) => f.includes('services') && !f.includes('__tests__'),
    );

    for (const serviceFile of serviceFiles) {
      const content = fs.readFileSync(serviceFile, 'utf8');
      const serviceName = path.basename(serviceFile, '.ts');

      const analysis = {
        name: serviceName,
        path: path.relative(this.srcDir, serviceFile),
        responsibilities: this.extractServiceResponsibilities(content),
        methods: this.extractServiceMethods(content),
        dependencies: this.extractServiceDependencies(content),
        complexity: this.calculateComplexity(content),
        usage: new Set(),
      };

      this.analysis.services.set(serviceName, analysis);
      this.categorizeByFunctionality(serviceName, analysis, 'service');
    }

    console.log(`📊 Analyzed ${serviceFiles.length} services`);
  }

  async analyzeTypes() {
    console.log('📝 Analyzing type definitions...');

    const typeFiles = this.getAllFiles(this.srcDir, ['.ts']).filter(
      (f) => f.includes('types') && !f.includes('__tests__'),
    );

    for (const typeFile of typeFiles) {
      const content = fs.readFileSync(typeFile, 'utf8');
      const typeName = path.basename(typeFile, '.ts');

      const analysis = {
        name: typeName,
        path: path.relative(this.srcDir, typeFile),
        responsibilities: this.extractTypeResponsibilities(content),
        exports: this.extractTypeExports(content),
        dependencies: this.extractTypeDependencies(content),
        usage: new Set(),
      };

      this.analysis.types.set(typeName, analysis);
      this.categorizeByFunctionality(typeName, analysis, 'type');
    }

    console.log(`📊 Analyzed ${typeFiles.length} type files`);
  }

  async analyzeModels() {
    console.log('📦 Analyzing models...');

    const modelFiles = this.getAllFiles(this.srcDir, ['.ts']).filter(
      (f) => f.includes(path.sep + 'models' + path.sep) && !f.includes('__tests__'),
    );

    for (const modelFile of modelFiles) {
      const content = fs.readFileSync(modelFile, 'utf8');
      const modelName = path.basename(modelFile, '.ts');

      const analysis = {
        name: modelName,
        path: path.relative(this.srcDir, modelFile),
        responsibilities: this.extractTypeResponsibilities(content),
        exports: this.extractTypeExports(content),
        dependencies: this.extractTypeDependencies(content),
        usage: new Set(),
      };

      this.analysis.models.set(modelName, analysis);
    }

    console.log(`📊 Analyzed ${modelFiles.length} models`);
  }

  async analyzeSchemas() {
    console.log('📐 Analyzing schemas...');

    const schemaFiles = this.getAllFiles(this.srcDir, ['.ts', '.json']).filter(
      (f) => f.includes(path.sep + 'schemas' + path.sep) && !f.includes('__tests__'),
    );

    for (const schemaFile of schemaFiles) {
      const content = fs.existsSync(schemaFile) ? fs.readFileSync(schemaFile, 'utf8') : '';
      const schemaName = path.basename(schemaFile);

      const analysis = {
        name: schemaName,
        path: path.relative(this.srcDir, schemaFile),
        responsibilities: content.includes('ContentDoc') ? ['contentdoc-schema'] : [],
        exports: [],
        dependencies: this.extractTypeDependencies(content),
        usage: new Set(),
      };

      this.analysis.schemas.set(schemaName, analysis);
    }

    console.log(`📊 Analyzed ${schemaFiles.length} schemas`);
  }

  // Extract responsibilities and functionality
  extractStoreResponsibilities(content) {
    const responsibilities = [];

    // Look for state properties
    const stateRegex = /state:\s*\(\)\s*=>\s*\(\{([^}]+)\}/s;
    const stateMatch = content.match(stateRegex);
    if (stateMatch) {
      const stateContent = stateMatch[1];
      if (stateContent.includes('theme')) responsibilities.push('theme-management');
      if (stateContent.includes('persona')) responsibilities.push('persona-management');
      if (stateContent.includes('tag')) responsibilities.push('tag-management');
      if (stateContent.includes('chat')) responsibilities.push('chat-functionality');
      if (stateContent.includes('story')) responsibilities.push('story-management');
      if (stateContent.includes('timeline')) responsibilities.push('timeline-management');
    }

    // Look for actions
    const actionsRegex = /actions:\s*\{([^}]+)\}/s;
    const actionsMatch = content.match(actionsRegex);
    if (actionsMatch) {
      const actionsContent = actionsMatch[1];
      if (actionsContent.includes('setTheme') || actionsContent.includes('updateTheme')) {
        responsibilities.push('theme-management');
      }
      if (actionsContent.includes('setPersona') || actionsContent.includes('updatePersona')) {
        responsibilities.push('persona-management');
      }
      if (actionsContent.includes('addTag') || actionsContent.includes('removeTag')) {
        responsibilities.push('tag-management');
      }
    }

    // Look for specific store patterns
    if (content.includes('useThemeStore') || content.includes('theme')) {
      responsibilities.push('theme-management');
    }
    if (content.includes('usePersonaStore') || content.includes('persona')) {
      responsibilities.push('persona-management');
    }
    if (content.includes('useTagStore') || content.includes('tag')) {
      responsibilities.push('tag-management');
    }
    if (content.includes('useChatStore') || content.includes('chat')) {
      responsibilities.push('chat-functionality');
    }
    if (content.includes('useStoryStore') || content.includes('story')) {
      responsibilities.push('story-management');
    }
    if (content.includes('useTimelineStore') || content.includes('timeline')) {
      responsibilities.push('timeline-management');
    }

    return [...new Set(responsibilities)];
  }

  extractComponentResponsibilities(content) {
    const responsibilities = [];

    // Analyze template content
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
    if (templateMatch) {
      const template = templateMatch[1];

      if (template.includes('v-theme') || template.includes('theme')) {
        responsibilities.push('theme-management');
      }
      if (template.includes('persona') || template.includes('avatar')) {
        responsibilities.push('persona-management');
      }
      if (template.includes('tag') || template.includes('Tag')) {
        responsibilities.push('tag-management');
      }
      if (template.includes('chat') || template.includes('message')) {
        responsibilities.push('chat-functionality');
      }
      if (template.includes('story') || template.includes('choice')) {
        responsibilities.push('story-management');
      }
      if (template.includes('timeline') || template.includes('event')) {
        responsibilities.push('timeline-management');
      }
    }

    // Analyze script content
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      const script = scriptMatch[1];

      if (script.includes('useThemeStore')) {
        responsibilities.push('theme-management');
      }
      if (script.includes('usePersonaStore')) {
        responsibilities.push('persona-management');
      }
      if (script.includes('useTagStore') || script.includes('TagRepository')) {
        responsibilities.push('tag-management');
      }
      if (script.includes('useChatStore')) {
        responsibilities.push('chat-functionality');
      }
      if (script.includes('useStoryStore')) {
        responsibilities.push('story-management');
      }
      if (script.includes('useTimelineStore')) {
        responsibilities.push('timeline-management');
      }
    }

    return [...new Set(responsibilities)];
  }

  extractComposableResponsibilities(content) {
    const responsibilities = [];

    if (content.includes('theme')) responsibilities.push('theme-management');
    if (content.includes('persona')) responsibilities.push('persona-management');
    if (content.includes('tag')) responsibilities.push('tag-management');
    if (content.includes('chat')) responsibilities.push('chat-functionality');
    if (content.includes('story')) responsibilities.push('story-management');
    if (content.includes('timeline')) responsibilities.push('timeline-management');
    if (content.includes('api') || content.includes('fetch'))
      responsibilities.push('data-persistence');
    if (content.includes('router') || content.includes('route'))
      responsibilities.push('routing-navigation');

    return [...new Set(responsibilities)];
  }

  extractUtilityResponsibilities(content) {
    const responsibilities = [];

    if (content.includes('color') || content.includes('theme'))
      responsibilities.push('theme-management');
    if (content.includes('tag')) responsibilities.push('tag-management');
    if (content.includes('format') || content.includes('string'))
      responsibilities.push('utility-functions');
    if (content.includes('validation')) responsibilities.push('utility-functions');
    if (content.includes('api') || content.includes('http'))
      responsibilities.push('data-persistence');

    return [...new Set(responsibilities)];
  }

  extractServiceResponsibilities(content) {
    const responsibilities = [];

    if (content.includes('chat') || content.includes('message'))
      responsibilities.push('chat-functionality');
    if (content.includes('api') || content.includes('http'))
      responsibilities.push('data-persistence');
    if (content.includes('storage') || content.includes('database'))
      responsibilities.push('data-persistence');

    return [...new Set(responsibilities)];
  }

  extractTypeResponsibilities(content) {
    const responsibilities = [];

    if (content.includes('Theme') || content.includes('theme'))
      responsibilities.push('theme-management');
    if (content.includes('Persona') || content.includes('persona'))
      responsibilities.push('persona-management');
    if (content.includes('Tag') || content.includes('tag')) responsibilities.push('tag-management');
    if (content.includes('Chat') || content.includes('chat'))
      responsibilities.push('chat-functionality');
    if (content.includes('Story') || content.includes('story'))
      responsibilities.push('story-management');
    if (content.includes('Timeline') || content.includes('timeline'))
      responsibilities.push('timeline-management');

    return [...new Set(responsibilities)];
  }

  // Extract specific implementation details
  extractStoreState(content) {
    const stateRegex = /state:\s*\(\)\s*=>\s*\(\{([^}]+)\}/s;
    const match = content.match(stateRegex);
    if (match) {
      return match[1].split(',').map((prop) => prop.trim().split(':')[0].trim());
    }
    return [];
  }

  extractStoreActions(content) {
    const actionsRegex = /actions:\s*\{([^}]+)\}/s;
    const match = content.match(actionsRegex);
    if (match) {
      const actionsContent = match[1];
      const actionRegex = /(\w+)\s*\([^)]*\)\s*\{/g;
      const actions = [];
      let actionMatch;
      while ((actionMatch = actionRegex.exec(actionsContent)) !== null) {
        actions.push(actionMatch[1]);
      }
      return actions;
    }
    return [];
  }

  extractStoreGetters(content) {
    const gettersRegex = /getters:\s*\{([^}]+)\}/s;
    const match = content.match(gettersRegex);
    if (match) {
      const gettersContent = match[1];
      const getterRegex = /(\w+)\s*\([^)]*\)\s*=>/g;
      const getters = [];
      let getterMatch;
      while ((getterMatch = getterRegex.exec(gettersContent)) !== null) {
        getters.push(getterMatch[1]);
      }
      return getters;
    }
    return [];
  }

  extractComponentProps(content) {
    const propsRegex = /props:\s*\{([^}]+)\}/s;
    const match = content.match(propsRegex);
    if (match) {
      const propsContent = match[1];
      const propRegex = /(\w+):/g;
      const props = [];
      let propMatch;
      while ((propMatch = propRegex.exec(propsContent)) !== null) {
        props.push(propMatch[1]);
      }
      return props;
    }
    return [];
  }

  extractComponentEmits(content) {
    const emitsRegex = /emits:\s*\[([^\]]+)\]/s;
    const match = content.match(emitsRegex);
    if (match) {
      return match[1].split(',').map((emit) => emit.trim().replace(/['"]/g, ''));
    }
    return [];
  }

  extractComposableExports(content) {
    const exportRegex = /export\s+(?:const|function)\s+(\w+)/g;
    const exports = [];
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  extractUtilityExports(content) {
    const exportRegex = /export\s+(?:const|function|class)\s+(\w+)/g;
    const exports = [];
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  extractServiceMethods(content) {
    const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g;
    const methods = [];
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1]);
    }
    return methods;
  }

  extractTypeExports(content) {
    const exportRegex = /export\s+(?:interface|type|enum)\s+(\w+)/g;
    const exports = [];
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  // Extract dependencies
  extractStoreDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  extractComponentDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  extractComposableDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  extractUtilityDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  extractServiceDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  extractTypeDependencies(content) {
    const dependencies = [];
    const importRegex = /import\s+.*?\s+from\s+['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      dependencies.push(match[1]);
    }
    return dependencies;
  }

  // Calculate complexity metrics
  calculateComplexity(content) {
    const lines = content.split('\n').length;
    const functions = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    const imports = (content.match(/import\s+/g) || []).length;

    return {
      lines,
      functions,
      classes,
      imports,
      complexity: lines + functions * 2 + classes * 3,
    };
  }

  analyzeTemplateComplexity(content) {
    const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
    if (!templateMatch) return { elements: 0, directives: 0, complexity: 0 };

    const template = templateMatch[1];
    const elements = (template.match(/<\w+/g) || []).length;
    const directives = (template.match(/v-\w+/g) || []).length;

    return {
      elements,
      directives,
      complexity: elements + directives,
    };
  }

  analyzeScriptComplexity(content) {
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (!scriptMatch) return { lines: 0, functions: 0, complexity: 0 };

    const script = scriptMatch[1];
    const lines = script.split('\n').length;
    const functions = (script.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;

    return {
      lines,
      functions,
      complexity: lines + functions * 2,
    };
  }

  // Categorize by functionality
  categorizeByFunctionality(name, analysis, type) {
    for (const responsibility of analysis.responsibilities) {
      if (this.functionalCategories[responsibility]) {
        this.functionalCategories[responsibility].push({
          name,
          type,
          analysis,
        });
      }
    }
  }

  // Identify functional groups and redundancies
  async identifyFunctionalGroups() {
    console.log('🔍 Identifying functional groups and redundancies...');

    // Analyze theme management
    this.analyzeThemeManagement();

    // Analyze persona management
    this.analyzePersonaManagement();

    // Analyze tag management
    this.analyzeTagManagement();

    // Analyze other functional areas
    this.analyzeOtherFunctionalAreas();
  }

  analyzeThemeManagement() {
    const themeItems = this.functionalCategories['theme-management'];

    if (themeItems.length > 1) {
      const stores = themeItems.filter((item) => item.type === 'store');
      const utilities = themeItems.filter((item) => item.type === 'utility');

      // Check for redundancy between theme stores
      if (stores.length > 1) {
        this.analysis.redundancies.push({
          type: 'store-redundancy',
          category: 'theme-management',
          items: stores.map((s) => s.name),
          issue: 'Multiple stores handling theme management',
          recommendation: 'Consolidate theme logic into a single store',
        });
      }

      // Check for scattered theme logic
      if (utilities.length > 0 && stores.length > 0) {
        this.analysis.redundancies.push({
          type: 'scattered-logic',
          category: 'theme-management',
          items: [...stores.map((s) => s.name), ...utilities.map((u) => u.name)],
          issue: 'Theme logic scattered across stores and utilities',
          recommendation: 'Centralize theme logic in store, use utilities for helpers only',
        });
      }
    }
  }

  analyzePersonaManagement() {
    const personaItems = this.functionalCategories['persona-management'];

    if (personaItems.length > 1) {
      const stores = personaItems.filter((item) => item.type === 'store');
      const services = personaItems.filter((item) => item.type === 'service');

      // Check for redundancy between persona stores
      if (stores.length > 1) {
        this.analysis.redundancies.push({
          type: 'store-redundancy',
          category: 'persona-management',
          items: stores.map((s) => s.name),
          issue: 'Multiple stores handling persona management',
          recommendation: 'Consolidate persona logic into a single store',
        });
      }

      // Check for service/store overlap
      if (services.length > 0 && stores.length > 0) {
        this.analysis.redundancies.push({
          type: 'service-store-overlap',
          category: 'persona-management',
          items: [...stores.map((s) => s.name), ...services.map((s) => s.name)],
          issue: 'Persona logic split between services and stores',
          recommendation: 'Use stores for state, services for external API calls only',
        });
      }
    }
  }

  analyzeTagManagement() {
    const tagItems = this.functionalCategories['tag-management'];

    if (tagItems.length > 1) {
      const stores = tagItems.filter((item) => item.type === 'store');
      const utilities = tagItems.filter((item) => item.type === 'utility');
      const services = tagItems.filter((item) => item.type === 'service');

      // Check for complex tag management
      if (stores.length + services.length + utilities.length > 3) {
        this.analysis.redundancies.push({
          type: 'over-engineered',
          category: 'tag-management',
          items: [
            ...stores.map((s) => s.name),
            ...services.map((s) => s.name),
            ...utilities.map((u) => u.name),
          ],
          issue: 'Tag management spread across too many layers',
          recommendation: 'Simplify tag management architecture',
        });
      }
    }
  }

  analyzeOtherFunctionalAreas() {
    // Analyze each functional category for issues
    for (const [category, items] of Object.entries(this.functionalCategories)) {
      if (items.length > 3) {
        const types = [...new Set(items.map((item) => item.type))];

        if (types.length > 3) {
          this.analysis.redundancies.push({
            type: 'architectural-complexity',
            category,
            items: items.map((item) => item.name),
            issue: `Too many different types handling ${category}`,
            recommendation: `Simplify ${category} architecture`,
          });
        }
      }
    }
  }

  // Analyze data flow
  async analyzeDataFlow() {
    console.log('🔄 Analyzing data flow...');

    // Map how data flows between stores, components, and services
    for (const [storeName, store] of this.analysis.stores) {
      for (const dependency of store.dependencies) {
        if (dependency.includes('stores/')) {
          const depStoreName = path.basename(dependency, '.ts');
          if (!this.analysis.dataFlow.has(storeName)) {
            this.analysis.dataFlow.set(storeName, new Set());
          }
          this.analysis.dataFlow.get(storeName).add(depStoreName);
        }
      }
    }
  }

  // Find code islands
  async findCodeIslands() {
    console.log('🏝️ Finding code islands...');

    // Find components with no clear purpose or usage
    for (const [componentName, component] of this.analysis.components) {
      if (component.responsibilities.length === 0) {
        this.analysis.codeIslands.push({
          type: 'unclear-purpose',
          name: componentName,
          path: component.path,
          issue: 'Component has no clear functional responsibilities',
          recommendation: 'Either define clear purpose or remove',
        });
      }
    }

    // Find utilities with single responsibility but no clear usage
    for (const [utilName, util] of this.analysis.utilities) {
      if (util.responsibilities.length === 1 && util.complexity.complexity < 10) {
        this.analysis.codeIslands.push({
          type: 'simple-utility',
          name: utilName,
          path: util.path,
          issue: 'Simple utility that might be inlined',
          recommendation: 'Consider inlining or consolidating with related utilities',
        });
      }
    }

    // Find stores with overlapping responsibilities
    const storeGroups = new Map();
    for (const [storeName, store] of this.analysis.stores) {
      for (const responsibility of store.responsibilities) {
        if (!storeGroups.has(responsibility)) {
          storeGroups.set(responsibility, []);
        }
        storeGroups.get(responsibility).push(storeName);
      }
    }

    for (const [responsibility, stores] of storeGroups) {
      if (stores.length > 1) {
        this.analysis.codeIslands.push({
          type: 'overlapping-stores',
          name: stores.join(', '),
          path: 'Multiple stores',
          issue: `Multiple stores handling ${responsibility}`,
          recommendation: `Consolidate ${responsibility} into single store`,
        });
      }
    }
  }

  // Assess architectural issues
  async assessArchitecturalIssues() {
    console.log('⚠️ Assessing architectural issues...');

    // Check for circular dependencies
    this.checkCircularDependencies();

    // Check for deep dependency chains
    this.checkDeepDependencies();

    // Check for inconsistent patterns
    this.checkInconsistentPatterns();
  }

  checkCircularDependencies() {
    // Simple circular dependency check
    for (const [storeName] of this.analysis.stores) {
      const visited = new Set();
      const recStack = new Set();

      if (this.hasCircularDependency(storeName, visited, recStack)) {
        this.analysis.architecturalIssues.push({
          type: 'circular-dependency',
          component: storeName,
          issue: 'Circular dependency detected',
          recommendation: 'Refactor to break circular dependency',
        });
      }
    }
  }

  hasCircularDependency(storeName, visited, recStack) {
    if (recStack.has(storeName)) return true;
    if (visited.has(storeName)) return false;

    visited.add(storeName);
    recStack.add(storeName);

    const store = this.analysis.stores.get(storeName);
    if (store) {
      for (const dep of store.dependencies) {
        if (dep.includes('stores/')) {
          const depStoreName = path.basename(dep, '.ts');
          if (this.hasCircularDependency(depStoreName, visited, recStack)) {
            return true;
          }
        }
      }
    }

    recStack.delete(storeName);
    return false;
  }

  checkDeepDependencies() {
    for (const [storeName] of this.analysis.stores) {
      const depth = this.calculateDependencyDepth(storeName, new Set());
      if (depth > 3) {
        this.analysis.architecturalIssues.push({
          type: 'deep-dependencies',
          component: storeName,
          issue: `Deep dependency chain (depth: ${depth})`,
          recommendation: 'Simplify dependency structure',
        });
      }
    }
  }

  calculateDependencyDepth(storeName, visited) {
    if (visited.has(storeName)) return 0;

    visited.add(storeName);
    const store = this.analysis.stores.get(storeName);
    if (!store) return 0;

    let maxDepth = 0;
    for (const dep of store.dependencies) {
      if (dep.includes('stores/')) {
        const depStoreName = path.basename(dep, '.ts');
        const depth = this.calculateDependencyDepth(depStoreName, visited);
        maxDepth = Math.max(maxDepth, depth);
      }
    }

    return maxDepth + 1;
  }

  checkInconsistentPatterns() {
    // Check for inconsistent naming patterns
    const storeNames = Array.from(this.analysis.stores.keys());

    // Check for inconsistent store naming
    const storeNamingPatterns = storeNames.map((name) => {
      if (name.endsWith('Store')) return 'Store';
      if (name.startsWith('use')) return 'use';
      return 'other';
    });

    const uniquePatterns = [...new Set(storeNamingPatterns)];
    if (uniquePatterns.length > 1) {
      this.analysis.architecturalIssues.push({
        type: 'inconsistent-naming',
        component: 'stores',
        issue: 'Inconsistent store naming patterns',
        recommendation: 'Standardize store naming convention',
      });
    }
  }

  // Generate comprehensive report
  async generateComprehensiveReport() {
    console.log('📊 Generating comprehensive report...');

    const report = {
      summary: this.generateSummary(),
      functionalGroups: this.generateFunctionalGroupsReport(),
      redundancies: this.analysis.redundancies,
      codeIslands: this.analysis.codeIslands,
      architecturalIssues: this.analysis.architecturalIssues,
      dataFlow: this.generateDataFlowReport(),
      recommendations: this.generateRecommendations(),
      legacy: this.generateLegacyReport(),
      detailedAnalysis: this.generateDetailedAnalysis(),
    };

    // Write comprehensive report
    const reportPath = path.join(__dirname, 'comprehensive-functional-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Write markdown report
    const markdownReport = this.generateMarkdownReport(report);
    const markdownPath = path.join(__dirname, 'COMPREHENSIVE_FUNCTIONAL_ANALYSIS.md');
    fs.writeFileSync(markdownPath, markdownReport);

    console.log(`📊 Comprehensive functional analysis complete!`);
    if (report.legacy) {
      const legacyRefCount = report.legacy.legacyReferences?.length || 0;
      const unusedCount = report.legacy.unusedLegacy?.length || 0;
      console.log(`♻️ Legacy references found: ${legacyRefCount}`);
      console.log(`🗑️ Unused legacy files: ${unusedCount}`);
    }
    console.log(`📋 JSON report: ${reportPath}`);
    console.log(`📄 Markdown report: ${markdownPath}`);

    return report;
  }

  generateSummary() {
    return {
      totalFiles: this.getTotalFiles(),
      stores: this.analysis.stores.size,
      components: this.analysis.components.size,
      composables: this.analysis.composables.size,
      utilities: this.analysis.utilities.size,
      services: this.analysis.services.size,
      types: this.analysis.types.size,
      functionalCategories: Object.keys(this.functionalCategories).length,
      redundancies: this.analysis.redundancies.length,
      codeIslands: this.analysis.codeIslands.length,
      architecturalIssues: this.analysis.architecturalIssues.length,
    };
  }

  generateFunctionalGroupsReport() {
    const report = {};

    for (const [category, items] of Object.entries(this.functionalCategories)) {
      if (items.length > 0) {
        report[category] = {
          count: items.length,
          items: items.map((item) => ({
            name: item.name,
            type: item.type,
            responsibilities: item.analysis.responsibilities,
            complexity: item.analysis.complexity || { complexity: 0 },
          })),
        };
      }
    }

    return report;
  }

  generateDataFlowReport() {
    const report = {};

    for (const [storeName, dependencies] of this.analysis.dataFlow) {
      report[storeName] = Array.from(dependencies);
    }

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Prioritize recommendations based on impact
    for (const redundancy of this.analysis.redundancies) {
      recommendations.push({
        priority: 'high',
        type: 'redundancy',
        issue: redundancy.issue,
        recommendation: redundancy.recommendation,
        affectedItems: redundancy.items,
      });
    }

    for (const island of this.analysis.codeIslands) {
      recommendations.push({
        priority: 'medium',
        type: 'code-island',
        issue: island.issue,
        recommendation: island.recommendation,
        affectedItems: [island.name],
      });
    }

    for (const issue of this.analysis.architecturalIssues) {
      recommendations.push({
        priority: 'high',
        type: 'architectural',
        issue: issue.issue,
        recommendation: issue.recommendation,
        affectedItems: [issue.component],
      });
    }

    return recommendations;
  }

  generateDetailedAnalysis() {
    return {
      stores: Object.fromEntries(this.analysis.stores),
      components: Object.fromEntries(this.analysis.components),
      composables: Object.fromEntries(this.analysis.composables),
      utilities: Object.fromEntries(this.analysis.utilities),
      services: Object.fromEntries(this.analysis.services),
      types: Object.fromEntries(this.analysis.types),
    };
  }

  generateMarkdownReport(report) {
    return `# Comprehensive Functional Architecture Analysis Report

## TTG Quasar / CLCA Integration Codebase

**Analysis Date:** ${new Date().toISOString().split('T')[0]}
**Analysis Method:** Comprehensive functional architecture analysis with redundancy detection

---

## Executive Summary

This analysis examines the functional architecture of your codebase to identify redundancies, code islands, and architectural issues that create maintenance problems.

### Key Metrics

- **Total Files:** ${report.summary.totalFiles}
- **Stores:** ${report.summary.stores}
- **Components:** ${report.summary.components}
- **Composables:** ${report.summary.composables}
- **Utilities:** ${report.summary.utilities}
- **Services:** ${report.summary.services}
- **Types:** ${report.summary.types}
- **Redundancies:** ${report.summary.redundancies}
- **Code Islands:** ${report.summary.codeIslands}
- **Architectural Issues:** ${report.summary.architecturalIssues}

---

## Functional Groups Analysis

${Object.entries(report.functionalGroups)
  .map(
    ([category, data]) =>
      `### ${category.replace('-', ' ').toUpperCase()} (${data.count} items)
${data.items
  .map(
    (item) =>
      `- **${item.name}** (${item.type}): ${item.responsibilities.join(', ')} - Complexity: ${item.complexity.complexity}`,
  )
  .join('\n')}`,
  )
  .join('\n\n')}

---

## Redundancies Found

${report.redundancies
  .map(
    (red) =>
      `### ${red.type.toUpperCase()} - ${red.category}
- **Items:** ${red.items.join(', ')}
- **Issue:** ${red.issue}
- **Recommendation:** ${red.recommendation}`,
  )
  .join('\n\n')}

---

## Code Islands

${report.codeIslands
  .map(
    (island) =>
      `### ${island.type.toUpperCase()}
- **Name:** ${island.name}
- **Path:** ${island.path}
- **Issue:** ${island.issue}
- **Recommendation:** ${island.recommendation}`,
  )
  .join('\n\n')}

---

## Architectural Issues

${report.architecturalIssues
  .map(
    (issue) =>
      `### ${issue.type.toUpperCase()}
- **Component:** ${issue.component}
- **Issue:** ${issue.issue}
- **Recommendation:** ${issue.recommendation}`,
  )
  .join('\n\n')}

---

## Data Flow

${Object.entries(report.dataFlow)
  .map(
    ([store, deps]) =>
      `### ${store}
- **Dependencies:** ${deps.join(', ')}`,
  )
  .join('\n')}

---

## Recommendations

### High Priority

${report.recommendations
  .filter((rec) => rec.priority === 'high')
  .map((rec) => `- **${rec.type.toUpperCase()}**: ${rec.issue} → ${rec.recommendation}`)
  .join('\n')}

### Medium Priority

${report.recommendations
  .filter((rec) => rec.priority === 'medium')
  .map((rec) => `- **${rec.type.toUpperCase()}**: ${rec.issue} → ${rec.recommendation}`)
  .join('\n')}

---

## Next Steps

1. **Address high-priority redundancies** first
2. **Consolidate overlapping functionality**
3. **Simplify architectural issues**
4. **Remove or refactor code islands**
5. **Establish consistent patterns**

---

_This analysis helps identify functional redundancies and architectural issues that create maintenance problems._

---

## Legacy References & Unused (ContentDoc Migration)

### Files referencing legacy models/collections
${(report.legacy?.legacyReferences || [])
  .map((ref) => `- ${ref.path} (${ref.matches.join(', ')})`)
  .join('\n')}

### Unused legacy candidates (no inbound imports)
${(report.legacy?.unusedLegacy || []).map((f) => `- ${f}`).join('\n')}
`;
  }

  getTotalFiles() {
    return (
      this.analysis.stores.size +
      this.analysis.components.size +
      this.analysis.composables.size +
      this.analysis.utilities.size +
      this.analysis.services.size +
      this.analysis.types.size
    );
  }

  getAllFiles(dir, extensions = ['.vue', '.ts', '.js']) {
    const files = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          if (!['node_modules', 'dist', '.git', '.vscode', 'coverage'].includes(item)) {
            files.push(...this.getAllFiles(fullPath, extensions));
          }
        } else if (extensions.some((ext) => item.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read directory ${dir}:`, error.message);
    }

    return files;
  }

  async buildImportGraph() {
    console.log('🧭 Building import graph...');
    const allFiles = this.getAllFiles(this.srcDir, ['.ts', '.js', '.vue']);
    for (const file of allFiles) {
      let content = '';
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch {
        // ignore read errors
      }
      const relPath = path.relative(this.srcDir, file);
      if (!this.analysis.importGraph.has(relPath)) {
        this.analysis.importGraph.set(relPath, new Set());
      }

      // TS/JS imports
      const importRegex = /import\s+[^'"\n]+from\s+['"]([^'"\n]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const spec = match[1];
        if (spec.startsWith('.')) {
          const target = this.resolveImportPath(file, spec);
          if (target) {
            const relTarget = path.relative(this.srcDir, target);
            if (!this.analysis.importGraph.has(relTarget)) {
              this.analysis.importGraph.set(relTarget, new Set());
            }
            this.analysis.importGraph.get(relTarget).add(relPath);
          }
        }
      }

      // Vue SFC: also capture script setup imports (same regex covers it)
    }
  }

  resolveImportPath(fromFile, spec) {
    const base = path.dirname(fromFile);
    const tryPaths = [
      path.resolve(base, spec + '.ts'),
      path.resolve(base, spec + '.js'),
      path.resolve(base, spec + '.vue'),
      path.resolve(base, spec, 'index.ts'),
      path.resolve(base, spec, 'index.js'),
    ];
    for (const p of tryPaths) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  async analyzeLegacyReferences() {
    console.log('♻️ Scanning for legacy model references...');
    const allFiles = this.getAllFiles(this.srcDir, ['.ts', '.js', '.vue']);

    for (const file of allFiles) {
      let content = '';
      try {
        content = fs.readFileSync(file, 'utf8');
      } catch {
        // ignore read errors
      }

      const matches = [];
      for (const re of this.legacyIndicators) {
        if (re.test(content)) {
          matches.push(re.source);
        }
      }

      // Heuristic: file name hints
      const fileName = path.basename(file);
      if (
        matches.length > 0 ||
        this.legacyFileNameHints.some((hint) => fileName.toLowerCase().includes(hint.toLowerCase()))
      ) {
        this.analysis.legacyReferences.push({
          path: path.relative(this.srcDir, file),
          matches: [...new Set(matches)],
        });
      }

      // Collect legacy candidates for potential removal
      if (
        /submission/i.test(fileName) ||
        fileName === 'EventSubmission.ts' ||
        fileName === 'GameSubmission.ts'
      ) {
        this.analysis.legacyCandidates.push(path.relative(this.srcDir, file));
      }
    }
  }

  async findUnusedLegacy() {
    console.log('🗑️ Identifying unused legacy files...');
    const inboundMap = this.analysis.importGraph;
    const unused = [];

    for (const legacyPath of this.analysis.legacyCandidates) {
      const inbound = inboundMap.get(legacyPath);
      if (!inbound || inbound.size === 0) {
        unused.push(legacyPath);
      }
    }

    this.analysis.unusedLegacy = unused;
  }

  generateLegacyReport() {
    return {
      legacyReferences: this.analysis.legacyReferences,
      unusedLegacy: this.analysis.unusedLegacy,
    };
  }
}

// Run the comprehensive functional architecture analysis
const analyzer = new ComprehensiveFunctionalAnalyzer();
analyzer.analyze().catch(console.error);
