const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ]
});

// Store active tickets
const activeTickets = new Map();
global.activeTickets = activeTickets; // Expose for database sync

// Store onboarding requests
const onboardingTickets = new Map();

// Store resolved tickets for auto-close monitoring
const resolvedTickets = new Map(); // ticketId -> { resolvedAt, warnedAt, closedAt }

// Rate limiting: Track user interactions
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_TICKETS_PER_WINDOW = 3; // Max 3 tickets per minute per user

// Ticket Templates Configuration
const TICKET_TEMPLATES = {
    'password-reset': {
        title: 'Solicitação de Reset de Senha',
        description: '**Usuário:** [Nome do usuário]\n**Email:** [email@example.com]\n**Razão:** [Esqueci minha senha / Conta bloqueada / Outro]\n\n**Detalhes adicionais:**\n[Descreva qualquer informação relevante]',
        team: 'dev',
        type: 'bug',
        priority: 'p2',
        tags: ['password', 'access']
    },
    'access-request': {
        title: 'Solicitação de Acesso',
        description: '**Sistema/Recurso:** [Nome do sistema]\n**Tipo de acesso necessário:** [Leitura / Escrita / Admin]\n**Justificativa:** [Por que precisa deste acesso]\n**Urgência:** [Data limite, se aplicável]\n\n**Informações adicionais:**\n[Detalhes relevantes]',
        team: 'dev',
        type: 'feature',
        priority: 'p2',
        tags: ['access', 'permissions']
    },
    'content-request': {
        title: 'Solicitação de Conteúdo',
        description: '**Tipo de conteúdo:** [Post / Vídeo / Imagem / Story]\n**Plataforma:** [Instagram / TikTok / YouTube / Outro]\n**Prazo:** [Data de entrega]\n**Briefing:** [Descrição do que é necessário]\n\n**Referências:**\n[Links ou exemplos]',
        team: 'coordenacao',
        type: 'conteudo',
        priority: 'p2',
        tags: ['content', 'social-media']
    },
    'event-planning': {
        title: 'Planejamento de Evento',
        description: '**Nome do Evento:** [Nome]\n**Data:** [Data do evento]\n**Local:** [Presencial / Online]\n**Público estimado:** [Número]\n**Orçamento:** [Valor ou N/A]\n\n**Descrição:**\n[Detalhes do evento]\n\n**Necessidades:**\n[O que precisa ser providenciado]',
        team: 'coordenacao',
        type: 'evento',
        priority: 'p2',
        tags: ['event', 'planning']
    },
    'candidate-issue': {
        title: 'Questão sobre Candidato',
        description: '**Nome do Candidato:** [Nome]\n**Posição:** [Vaga pretendida]\n**Etapa do processo:** [Triagem / Entrevista / Teste / Outro]\n**Questão:** [Descreva o problema ou dúvida]\n\n**Contexto adicional:**\n[Informações relevantes]',
        team: 'recrutamento',
        type: 'candidato',
        priority: 'p2',
        tags: ['candidate', 'recruitment']
    }
};

// Ticket Tags/Labels System
const TICKET_TAGS = {
    'urgent': { emoji: '⚠️', label: 'Urgente', color: '#FF0000' },
    'needs-approval': { emoji: '✅', label: 'Precisa Aprovação', color: '#FFA500' },
    'blocked': { emoji: '🚫', label: 'Bloqueado', color: '#8B0000' },
    'waiting-on-user': { emoji: '⏸️', label: 'Aguardando Usuário', color: '#FFD700' },
    'in-review': { emoji: '👀', label: 'Em Revisão', color: '#00CED1' },
    'escalated': { emoji: '📢', label: 'Escalado', color: '#FF4500' },
    'duplicate': { emoji: '🔄', label: 'Duplicado', color: '#808080' },
    'wont-fix': { emoji: '❌', label: 'Não Será Corrigido', color: '#696969' }
};

// Business Hours Configuration (for SLA calculation)
const BUSINESS_HOURS = {
    enabled: true,  // Set to false to count all hours
    timezone: 'America/Sao_Paulo',  // Brazil timezone
    workDays: [1, 2, 3, 4, 5],  // Monday to Friday (0 = Sunday, 6 = Saturday)
    startHour: 9,   // 9 AM
    endHour: 18,    // 6 PM
    excludeDates: [  // Holidays (format: 'YYYY-MM-DD')
        // Add Brazilian holidays as needed
        '2025-01-01',  // New Year
        '2025-04-21',  // Tiradentes Day
        '2025-05-01',  // Labor Day
        '2025-09-07',  // Independence Day
        '2025-10-12',  // Nossa Senhora Aparecida
        '2025-11-02',  // All Souls' Day
        '2025-11-15',  // Proclamation of the Republic
        '2025-12-25',  // Christmas
    ]
};

// Auto-close configuration
const AUTO_CLOSE_CONFIG = {
    enabled: true,
    warningHours: 24,  // Warn after 24 hours of inactivity
    closeHours: 48,    // Close after 48 hours of inactivity
    checkInterval: 60 * 60 * 1000  // Check every hour
};

// Security: Blocked patterns for XSS/injection prevention
const BLOCKED_PATTERNS = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /<iframe[^>]*>[\s\S]*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload, etc.
    /@everyone/gi,
    /@here/gi,
];

// SLA Configuration (P0-P3 Priority System) - Updated timings
const SLA_CONFIG = {
    p0: {
        hours: 24,  // 24 hours
        label: 'P0 - Crítico',
        shortLabel: 'P0',
        color: '#8B0000',  // Dark Red
        warningColor: '#FF0000',  // Red (when 50% time passed)
        criticalColor: '#8B0000',  // Dark Red (when 80% time passed)
        emoji: '🔥',
        canCreate: ['⚡ Dev Master', '🔴 CEO', '🟠 Commercial Lead', '🟠 Coordination Lead', '🟠 Recruitment Lead'],
        escalate: true,  // Auto-ping managers on breach
        escalateRoles: ['⚡ Dev Master', '🔴 CEO']
    },
    p1: {
        hours: 48,  // 48 hours
        label: 'P1 - Alta',
        shortLabel: 'P1',
        color: '#FF0000',  // Red
        warningColor: '#FF4500',  // Orange Red (when 50% time passed)
        criticalColor: '#FF0000',  // Red (when 80% time passed)
        emoji: '🔴',
        canCreate: ['⚡ Dev Master', '🔴 CEO', '🟠 Commercial Lead', '🟠 Coordination Lead', '🟠 Recruitment Lead'],
        escalate: true,  // Auto-ping managers on breach
        escalateRoles: ['⚡ Dev Master', '🔴 CEO']
    },
    p2: {
        hours: 72,  // 72 hours (3 days)
        label: 'P2 - Média',
        shortLabel: 'P2',
        color: '#FFA500',  // Orange
        warningColor: '#FF8C00',  // Dark Orange (when 50% time passed)
        criticalColor: '#FFA500',  // Orange (when 80% time passed)
        emoji: '🟠',
        canCreate: [], // Everyone can create
        escalate: false
    },
    p3: {
        hours: 128,  // 128 hours (~5 days)
        label: 'P3 - Baixa',
        shortLabel: 'P3',
        color: '#00FF00',  // Green
        warningColor: '#32CD32',  // Lime Green (when 50% time passed)
        criticalColor: '#FFD700',  // Gold (when 80% time passed)
        emoji: '🟢',
        canCreate: [], // Everyone can create
        escalate: false
    }
};

// Team configuration
const TEAMS = {
    dev: {
        name: 'DEV',
        emoji: '👨‍💻',
        color: '#00D9FF',
        category: '💻 DEV-OPS',
        dashboardChannel: '📋-tickets-dashboard',
        openChannel: '🟡-tickets-abertos',
        progressChannel: '⏳-tickets-andamento',
        resolvedChannel: '✅-tickets-resolvidos',
        ticketTypes: ['bug', 'feature'],
        // All team members can create dev tickets
        allowedRoles: [],  // Empty = everyone can create
        // Roles that are part of THIS team (for work channel access)
        teamRoles: ['⚡ Dev Master', '🔴 CEO', '💻 DevOps'],
        // Roles to ping when new ticket is created
        notifyRoles: ['⚡ Dev Master', '💻 DevOps']
    },
    comercial: {
        name: 'COMERCIAL',
        emoji: '💰',
        color: '#E67E22',
        category: '💰 COMERCIAL',
        dashboardChannel: '📋-tickets-dashboard',
        openChannel: '🟡-tickets-abertos',
        progressChannel: '⏳-tickets-andamento',
        resolvedChannel: '✅-tickets-resolvidos',
        ticketTypes: ['suporte', 'duvida', 'solicitacao'],
        // All team members can create commercial tickets
        allowedRoles: [],  // Empty = everyone can create
        // Roles that are part of THIS team (for work channel access)
        teamRoles: ['⚡ Dev Master', '🔴 CEO', '🟠 Commercial Lead', '🟡 Commercial Ops'],
        // Roles to ping when new ticket is created
        notifyRoles: ['🟠 Commercial Lead', '🟡 Commercial Ops']
    },
    coordenacao: {
        name: 'COORDENAÇÃO',
        emoji: '⚙️',
        color: '#F39C12',
        category: '⚙️ COORDENAÇÃO',
        dashboardChannel: '📋-tickets-dashboard',
        openChannel: '🟡-tickets-abertos',
        progressChannel: '⏳-tickets-andamento',
        resolvedChannel: '✅-tickets-resolvidos',
        ticketTypes: ['evento', 'conteudo', 'duvida'],
        // All team members can create coordination tickets
        allowedRoles: [],  // Empty = everyone can create
        // Roles that are part of THIS team (for work channel access)
        teamRoles: ['⚡ Dev Master', '🔴 CEO', '🟠 Coordination Lead', '🟡 Coordination Ops', '🟡 Social Media'],
        // Roles to ping when new ticket is created
        notifyRoles: ['🟠 Coordination Lead', '🟡 Coordination Ops', '🟡 Social Media']
    },
    recrutamento: {
        name: 'RECRUTAMENTO',
        emoji: '🎤',
        color: '#FF9800',
        category: '🎤 RECRUTAMENTO',
        dashboardChannel: '📋-tickets-dashboard',
        openChannel: '🟡-tickets-abertos',
        progressChannel: '⏳-tickets-andamento',
        resolvedChannel: '✅-tickets-resolvidos',
        ticketTypes: ['candidato', 'processo', 'duvida'],
        // All team members can create recruitment tickets
        allowedRoles: [],  // Empty = everyone can create
        // Roles that are part of THIS team (for work channel access)
        teamRoles: ['⚡ Dev Master', '🔴 CEO', '🟠 Recruitment Lead', '🟡 Recruitment Ops'],
        // Roles to ping when new ticket is created
        notifyRoles: ['🟠 Recruitment Lead', '🟡 Recruitment Ops']
    }
};

// Ticket type configurations
const TICKET_TYPES = {
    bug: { emoji: '🐛', name: 'Bug', description: 'Reportar problema técnico' },
    feature: { emoji: '✨', name: 'Feature', description: 'Solicitar nova funcionalidade' },
    suporte: { emoji: '💼', name: 'Suporte', description: 'Suporte comercial' },
    duvida: { emoji: '❓', name: 'Dúvida', description: 'Tirar dúvida' },
    solicitacao: { emoji: '📝', name: 'Solicitação', description: 'Solicitação geral' },
    evento: { emoji: '📅', name: 'Evento', description: 'Planejamento de evento' },
    conteudo: { emoji: '📱', name: 'Conteúdo', description: 'Conteúdo e social media' },
    candidato: { emoji: '👤', name: 'Candidato', description: 'Questão sobre candidato' },
    processo: { emoji: '📋', name: 'Processo', description: 'Processo de recrutamento' }
};

client.once('ready', async () => {
    console.log(`✅ Multi-Team Ticketing Bot logged in as ${client.user.tag}`);

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    await setupTicketingSystem(guild);
    await setupVerificationSystem(guild);
    await setupOnboardingSystem(guild);

    // Initialize dashboards
    await updateAllDashboards(guild);

    // Start SLA monitoring (check every 15 minutes)
    console.log('✅ SLA monitoring started (checking every 15 minutes)');
    setInterval(async () => {
        await checkSLABreaches(guild);
    }, 15 * 60 * 1000); // 15 minutes

    // Run initial SLA check
    await checkSLABreaches(guild);

    // Start auto-close monitoring (check every hour)
    if (AUTO_CLOSE_CONFIG.enabled) {
        console.log(`✅ Auto-close monitoring started (warning: ${AUTO_CLOSE_CONFIG.warningHours}h, close: ${AUTO_CLOSE_CONFIG.closeHours}h)`);
        setInterval(async () => {
            await checkAutoClose(guild);
        }, AUTO_CLOSE_CONFIG.checkInterval);

        // Run initial auto-close check
        await checkAutoClose(guild);
    }
});

// Welcome new members
client.on('guildMemberAdd', async (member) => {
    try {
        const guild = member.guild;
        const verificationChannel = guild.channels.cache.find(c => c.name === '✅-verificar');

        if (!verificationChannel) {
            console.log('❌ Verification channel not found');
            return;
        }

        logSecurityEvent('NEW_MEMBER', member.id, `User joined: ${member.user.tag}`);
        console.log(`👋 Novo membro: ${member.user.tag}`);

        // Send welcome message via DM (private, doesn't pollute channel)
        try {
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00D9FF')
                .setTitle('👋 Bem-vindo ao UltraCreators!')
                .setDescription(
                    `**Olá, ${member.user.username}!**\n\n` +
                    `Você acabou de entrar no servidor **Ultra Creators**! 🚀\n\n` +
                    `Para ter acesso aos canais, você precisa aceitar nossos termos e condições.\n\n` +
                    `📋 **Próximo passo:**\n` +
                    `Vá para o canal de verificação e clique no botão **"✅ Aceitar Termos"**.\n\n` +
                    `Nos vemos em breve! 🎉`
                )
                .setThumbnail(member.user.displayAvatarURL())
                .setFooter({ text: 'UltraCreators • Bem-vindo' })
                .setTimestamp();

            await member.send({ embeds: [welcomeEmbed] });
            console.log(`✅ Welcome DM sent to ${member.user.tag}`);
        } catch (error) {
            console.log(`⚠️ Could not DM ${member.user.tag} - DMs might be disabled`);
            // If DM fails, user will still see the verification channel instructions
        }

    } catch (error) {
        console.error('❌ Error in guildMemberAdd:', error);
    }
});

async function setupTicketingSystem(guild) {
    // Setup ticket panels in each team's dedicated channel

    // Priority explanation (same for all teams)
    const priorityInfo =
        '**📋 Níveis de Prioridade:**\n' +
        '🔥 **P0 - Crítico** (SLA: 24h) - Sistema fora do ar / Emergência _(Apenas Leads, CEO, Dev Master)_\n' +
        '🔴 **P1 - Alta** (SLA: 48h) - Problema grave _(Apenas Leads, CEO, Dev Master)_\n' +
        '🟠 **P2 - Média** (SLA: 72h) - Problema importante _(Todos)_\n' +
        '🟢 **P3 - Baixa** (SLA: 128h) - Melhoria ou problema menor _(Todos)_\n\n' +
        '⚠️ **Importante:** Após criar o ticket, você será adicionado a uma thread para acompanhamento.';

    // DEV TEAM - 🎫-criar-ticket-dev
    const devChannel = guild.channels.cache.find(c => c.name === '🎫-criar-ticket-dev');
    if (devChannel) {
        const messages = await devChannel.messages.fetch({ limit: 10 });
        await devChannel.bulkDelete(messages).catch(() => {});

        const devEmbed = new EmbedBuilder()
            .setColor('#2ECC71')
            .setTitle('💻 Sistema de Tickets - DEV TEAM')
            .setDescription(
                '**Bem-vindo ao sistema de tickets da equipe de desenvolvimento!**\n\n' +
                '🐛 **Bug** - Reportar problemas técnicos ou erros _(Todos podem reportar)_\n' +
                '✨ **Feature** - Solicitar novas funcionalidades _(Apenas Leads, Ops, CEO, Dev Master)_\n\n' +
                priorityInfo
            )
            .setTimestamp();

        const devRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_dev_bug')
                    .setLabel('🐛 Reportar Bug')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('ticket_dev_feature')
                    .setLabel('✨ Solicitar Feature')
                    .setStyle(ButtonStyle.Primary)
            );

        await devChannel.send({ embeds: [devEmbed], components: [devRow] });
        console.log('✅ DEV ticket panel created in 🎫-criar-ticket-dev');
    }

    // COMERCIAL - 🎫-criar-ticket-comercial
    const comercialChannel = guild.channels.cache.find(c => c.name === '🎫-criar-ticket-comercial');
    if (comercialChannel) {
        const messages = await comercialChannel.messages.fetch({ limit: 10 });
        await comercialChannel.bulkDelete(messages).catch(() => {});

        const comercialEmbed = new EmbedBuilder()
            .setColor('#E67E22')
            .setTitle('💰 Sistema de Tickets - COMERCIAL')
            .setDescription(
                '**Bem-vindo ao sistema de tickets da equipe comercial!**\n\n' +
                '💼 **Suporte** - Questões sobre vendas e afiliados\n' +
                '❓ **Dúvida** - Tirar dúvidas comerciais\n' +
                '📝 **Solicitação** - Solicitações e demandas gerais\n\n' +
                priorityInfo
            )
            .setTimestamp();

        const comercialRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_comercial_suporte')
                    .setLabel('💼 Suporte')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_comercial_duvida')
                    .setLabel('❓ Dúvida')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('ticket_comercial_solicitacao')
                    .setLabel('📝 Solicitação')
                    .setStyle(ButtonStyle.Primary)
            );

        await comercialChannel.send({ embeds: [comercialEmbed], components: [comercialRow] });
        console.log('✅ COMERCIAL ticket panel created in 🎫-criar-ticket-comercial');
    }

    // COORDENAÇÃO - 🎫-criar-ticket-coordenacao
    const coordChannel = guild.channels.cache.find(c => c.name === '🎫-criar-ticket-coordenacao');
    if (coordChannel) {
        const messages = await coordChannel.messages.fetch({ limit: 10 });
        await coordChannel.bulkDelete(messages).catch(() => {});

        const coordEmbed = new EmbedBuilder()
            .setColor('#F39C12')
            .setTitle('⚙️ Sistema de Tickets - COORDENAÇÃO')
            .setDescription(
                '**Bem-vindo ao sistema de tickets da equipe de coordenação!**\n\n' +
                '📅 **Evento** - Planejamento e organização de eventos\n' +
                '📱 **Conteúdo** - Social media e criação de conteúdo\n' +
                '❓ **Dúvida** - Tirar dúvidas sobre coordenação\n\n' +
                priorityInfo
            )
            .setTimestamp();

        const coordRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_coordenacao_evento')
                    .setLabel('📅 Evento')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_coordenacao_conteudo')
                    .setLabel('📱 Conteúdo')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_coordenacao_duvida')
                    .setLabel('❓ Dúvida')
                    .setStyle(ButtonStyle.Secondary)
            );

        await coordChannel.send({ embeds: [coordEmbed], components: [coordRow] });
        console.log('✅ COORDENAÇÃO ticket panel created in 🎫-criar-ticket-coordenacao');
    }

    // RECRUTAMENTO - 🎫-criar-ticket-recrutamento
    const recruitChannel = guild.channels.cache.find(c => c.name === '🎫-criar-ticket-recrutamento');
    if (recruitChannel) {
        const messages = await recruitChannel.messages.fetch({ limit: 10 });
        await recruitChannel.bulkDelete(messages).catch(() => {});

        const recruitEmbed = new EmbedBuilder()
            .setColor('#FF9800')
            .setTitle('🎤 Sistema de Tickets - RECRUTAMENTO')
            .setDescription(
                '**Bem-vindo ao sistema de tickets da equipe de recrutamento!**\n\n' +
                '👤 **Candidato** - Questões sobre candidatos específicos\n' +
                '📋 **Processo** - Dúvidas sobre processo seletivo\n' +
                '❓ **Dúvida** - Tirar dúvidas sobre recrutamento\n\n' +
                priorityInfo
            )
            .setTimestamp();

        const recruitRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ticket_recrutamento_candidato')
                    .setLabel('👤 Candidato')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('ticket_recrutamento_processo')
                    .setLabel('📋 Processo')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('ticket_recrutamento_duvida')
                    .setLabel('❓ Dúvida')
                    .setStyle(ButtonStyle.Secondary)
            );

        await recruitChannel.send({ embeds: [recruitEmbed], components: [recruitRow] });
        console.log('✅ RECRUTAMENTO ticket panel created in 🎫-criar-ticket-recrutamento');
    }

    console.log('✅ All team-specific ticket panels created successfully!');
}

// Security Functions
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    // Remove any blocked patterns
    let sanitized = input;
    for (const pattern of BLOCKED_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REMOVED]');
    }

    // Limit length
    if (sanitized.length > 1000) {
        sanitized = sanitized.substring(0, 1000);
    }

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    return sanitized.trim();
}

function checkRateLimit(userId) {
    const now = Date.now();
    const userLimit = rateLimits.get(userId) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW };

    // Reset if window expired
    if (now >= userLimit.resetAt) {
        userLimit.count = 0;
        userLimit.resetAt = now + RATE_LIMIT_WINDOW;
    }

    // Check if over limit
    if (userLimit.count >= MAX_TICKETS_PER_WINDOW) {
        const remainingTime = Math.ceil((userLimit.resetAt - now) / 1000);
        return { allowed: false, remainingTime };
    }

    // Increment count
    userLimit.count++;
    rateLimits.set(userId, userLimit);

    return { allowed: true };
}

function logSecurityEvent(type, userId, details) {
    const timestamp = new Date().toISOString();
    console.log(`🔒 [SECURITY] ${timestamp} - ${type} - User: ${userId} - ${details}`);
}

// ============================================================================
// NEW FEATURE HELPER FUNCTIONS
// ============================================================================

// Business Hours Calculation for SLA
function calculateBusinessHours(startTime, endTime) {
    if (!BUSINESS_HOURS.enabled) {
        return endTime - startTime; // Return actual elapsed time if business hours disabled
    }

    let businessMilliseconds = 0;
    let currentTime = new Date(startTime);
    const endDate = new Date(endTime);

    while (currentTime < endDate) {
        const dayOfWeek = currentTime.getDay();
        const dateString = currentTime.toISOString().split('T')[0];

        // Check if it's a work day and not a holiday
        if (BUSINESS_HOURS.workDays.includes(dayOfWeek) && !BUSINESS_HOURS.excludeDates.includes(dateString)) {
            const currentHour = currentTime.getHours();

            if (currentHour >= BUSINESS_HOURS.startHour && currentHour < BUSINESS_HOURS.endHour) {
                businessMilliseconds += 60 * 60 * 1000; // Add 1 hour
            }
        }

        currentTime = new Date(currentTime.getTime() + 60 * 60 * 1000); // Move to next hour
    }

    return businessMilliseconds;
}

// Get SLA color based on time remaining (visual warnings)
function getSLAColor(ticket) {
    const now = Date.now();
    const slaConfig = SLA_CONFIG[ticket.priorityKey];

    // If SLA is paused (waiting-on-user), return a neutral color
    if (ticket.slaPaused) {
        return '#FFD700'; // Gold
    }

    const totalTime = ticket.slaDeadline - ticket.createdAt;
    const elapsedTime = now - ticket.createdAt;
    const percentageElapsed = (elapsedTime / totalTime) * 100;

    // Visual warning levels:
    // 0-50%: Original color (normal)
    // 50-80%: Warning color (approaching deadline)
    // 80%+: Critical color (urgent)
    if (percentageElapsed >= 80) {
        return slaConfig.criticalColor;
    } else if (percentageElapsed >= 50) {
        return slaConfig.warningColor;
    } else {
        return slaConfig.color;
    }
}

// Add tag to ticket
function addTagToTicket(ticketId, tagKey) {
    const ticket = activeTickets.get(ticketId);
    if (!ticket) return false;

    if (!ticket.tags) {
        ticket.tags = [];
    }

    if (!ticket.tags.includes(tagKey)) {
        ticket.tags.push(tagKey);
        activeTickets.set(ticketId, ticket);
        return true;
    }

    return false;
}

// Remove tag from ticket
function removeTagFromTicket(ticketId, tagKey) {
    const ticket = activeTickets.get(ticketId);
    if (!ticket) return false;

    if (ticket.tags) {
        const index = ticket.tags.indexOf(tagKey);
        if (index > -1) {
            ticket.tags.splice(index, 1);
            activeTickets.set(ticketId, ticket);
            return true;
        }
    }

    return false;
}

// Get formatted tags string for embed
function getTagsString(ticket) {
    if (!ticket.tags || ticket.tags.length === 0) {
        return 'Nenhuma';
    }

    return ticket.tags
        .map(tagKey => {
            const tag = TICKET_TAGS[tagKey];
            return tag ? `${tag.emoji} ${tag.label}` : tagKey;
        })
        .join(', ');
}

// Pause SLA (for waiting-on-user state)
function pauseSLA(ticketId) {
    const ticket = activeTickets.get(ticketId);
    if (!ticket) return false;

    if (!ticket.slaPaused) {
        ticket.slaPaused = true;
        ticket.slaPausedAt = Date.now();
        activeTickets.set(ticketId, ticket);

        // Add waiting-on-user tag
        addTagToTicket(ticketId, 'waiting-on-user');

        return true;
    }

    return false;
}

// Resume SLA
function resumeSLA(ticketId) {
    const ticket = activeTickets.get(ticketId);
    if (!ticket) return false;

    if (ticket.slaPaused) {
        const pausedDuration = Date.now() - ticket.slaPausedAt;
        ticket.slaDeadline += pausedDuration; // Extend deadline by paused time
        ticket.slaPaused = false;
        ticket.slaPausedAt = null;
        activeTickets.set(ticketId, ticket);

        // Remove waiting-on-user tag
        removeTagFromTicket(ticketId, 'waiting-on-user');

        return true;
    }

    return false;
}

// Check for duplicate tickets (based on title similarity)
function findDuplicateTickets(title, team) {
    const duplicates = [];
    const normalizedTitle = title.toLowerCase().trim();

    for (const [ticketId, ticket] of activeTickets) {
        if (ticket.team === team && ticket.status !== 'resolved') {
            const ticketTitle = ticket.title.toLowerCase().trim();

            // Simple similarity check (can be enhanced with Levenshtein distance)
            if (ticketTitle === normalizedTitle) {
                duplicates.push(ticketId);
            } else if (ticketTitle.includes(normalizedTitle) || normalizedTitle.includes(ticketTitle)) {
                if (Math.abs(ticketTitle.length - normalizedTitle.length) < 10) {
                    duplicates.push(ticketId);
                }
            }
        }
    }

    return duplicates;
}

// Merge duplicate tickets
async function mergeTickets(guild, primaryTicketId, duplicateTicketId) {
    const primaryTicket = activeTickets.get(primaryTicketId);
    const duplicateTicket = activeTickets.get(duplicateTicketId);

    if (!primaryTicket || !duplicateTicket) {
        return { success: false, error: 'One or both tickets not found' };
    }

    try {
        // Add duplicate tag to duplicate ticket
        addTagToTicket(duplicateTicketId, 'duplicate');

        // Update duplicate ticket description to reference primary
        duplicateTicket.description += `\n\n---\n⚠️ **DUPLICADO - Mesclado com:** \`${primaryTicketId}\``;

        // Move duplicate ticket to resolved
        duplicateTicket.status = 'resolved';
        duplicateTicket.resolvedAt = Date.now();
        duplicateTicket.mergedWith = primaryTicketId;

        // Add note to primary ticket
        if (!primaryTicket.mergedTickets) {
            primaryTicket.mergedTickets = [];
        }
        primaryTicket.mergedTickets.push(duplicateTicketId);

        activeTickets.set(primaryTicketId, primaryTicket);
        activeTickets.set(duplicateTicketId, duplicateTicket);

        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function createTicketButtons(ticketId, status, ticket) {
    const rows = [];
    const mainRow = new ActionRowBuilder();

    if (status === 'open') {
        // Open tickets: "Take Ticket" button
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`take_${ticketId}`)
                .setLabel('Assumir Ticket')
                .setEmoji('👤')
                .setStyle(ButtonStyle.Primary)
        );
    } else if (status === 'progress') {
        // In Progress tickets: "Resolver" and "Reabrir" (back to open)
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`update_resolved_${ticketId}`)
                .setLabel('Resolver')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`update_reopen_${ticketId}`)
                .setLabel('Voltar para Abertos')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary)
        );
    } else if (status === 'resolved') {
        // Resolved tickets: Only "Reabrir"
        mainRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`update_reopen_${ticketId}`)
                .setLabel('Reabrir')
                .setEmoji('🔄')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    rows.push(mainRow);

    // Add management row (SLA pause, tags, merge) for in-progress and open tickets
    if (ticket && (status === 'open' || status === 'progress')) {
        const mgmtRow = new ActionRowBuilder();

        // SLA Pause/Resume button
        const slaPaused = ticket.slaPaused || false;
        mgmtRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`sla_${slaPaused ? 'resume' : 'pause'}_${ticketId}`)
                .setLabel(slaPaused ? 'Retomar SLA' : 'Pausar SLA')
                .setEmoji(slaPaused ? '▶️' : '⏸️')
                .setStyle(slaPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
        );

        // Add Tag button
        mgmtRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`tag_add_${ticketId}`)
                .setLabel('Adicionar Tag')
                .setEmoji('🏷️')
                .setStyle(ButtonStyle.Secondary)
        );

        // Remove Tag button (only if ticket has tags)
        if (ticket && ticket.tags && ticket.tags.length > 0) {
            mgmtRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`tag_remove_${ticketId}`)
                    .setLabel('Remover Tag')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger)
            );
        }

        // Merge Duplicate button
        if (status === 'open') {
            mgmtRow.addComponents(
                new ButtonBuilder()
                    .setCustomId(`merge_check_${ticketId}`)
                    .setLabel('Verificar Duplicados')
                    .setEmoji('🔄')
                    .setStyle(ButtonStyle.Secondary)
            );
        }

        rows.push(mgmtRow);
    }

    return rows;
}

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
    try {
        if (!interaction.isButton() && !interaction.isModalSubmit() && !interaction.isStringSelectMenu()) return;

        // Security: Verify interaction is from a guild member
        if (!interaction.member || !interaction.guild) {
            logSecurityEvent('UNAUTHORIZED', interaction.user.id, 'Interaction outside of guild');
            return;
        }

        // Security: Log all interactions
        const interactionType = interaction.isButton() ? 'Button' : interaction.isStringSelectMenu() ? 'SelectMenu' : 'Modal';
        logSecurityEvent('INTERACTION', interaction.user.id, `Type: ${interactionType}, CustomId: ${interaction.customId}`);

        // Handle ticket creation buttons
        if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        const [, team, ticketType] = interaction.customId.split('_');

        // Check permissions
        const teamConfig = TEAMS[team];
        if (!teamConfig) {
            await interaction.reply({ content: '❌ Equipe inválida!', ephemeral: true });
            return;
        }

        const memberRoles = interaction.member.roles.cache.map(r => r.name);

        // Special handling for dev team tickets
        if (team === 'dev') {
            // Bug reports: Everyone with a role can create
            if (ticketType === 'bug') {
                // Check if user has ANY role (not just @everyone)
                const hasAnyRole = memberRoles.length > 0;
                if (!hasAnyRole) {
                    await interaction.reply({
                        content: '❌ Você precisa ter uma função atribuída para reportar bugs!',
                        ephemeral: true
                    });
                    return;
                }
            }
            // Feature requests: Only Leads, CEO, Dev Master, Ops
            else if (ticketType === 'feature') {
                const featureAllowedRoles = ['⚡ Dev Master', '🔴 CEO', '🟠 Commercial Lead', '🟠 Coordination Lead', '🟠 Recruitment Lead', '💻 DevOps', '🟡 Commercial Ops', '🟡 Coordination Ops', '🟡 Social Media', '🟡 Recruitment Ops'];
                const hasPermission = featureAllowedRoles.some(role => memberRoles.includes(role));

                if (!hasPermission) {
                    await interaction.reply({
                        content: '❌ Apenas **Leads, Ops, CEO e Dev Master** podem solicitar novas funcionalidades!\n\nVocê pode reportar bugs usando o botão "🐛 Reportar Bug".',
                        ephemeral: true
                    });
                    return;
                }
            }
        } else {
            // For other teams, check if user has permission to create tickets for this team
            // If allowedRoles is empty, everyone can create. Otherwise, check for specific roles
            const hasPermission = teamConfig.allowedRoles.length === 0 ||
                                 teamConfig.allowedRoles.some(role => memberRoles.includes(role));

            if (!hasPermission) {
                await interaction.reply({
                    content: `❌ Você não tem permissão para criar tickets da equipe ${teamConfig.name}!`,
                    ephemeral: true
                });
                return;
            }
        }

        // Create modal
        const modal = new ModalBuilder()
            .setCustomId(`modal_${team}_${ticketType}`)
            .setTitle(`${teamConfig.emoji} ${teamConfig.name} - ${TICKET_TYPES[ticketType].name}`);

        const titleInput = new TextInputBuilder()
            .setCustomId('ticket_title')
            .setLabel('Título do Ticket')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Descreva brevemente o problema ou solicitação')
            .setRequired(true)
            .setMaxLength(256);

        const descriptionInput = new TextInputBuilder()
            .setCustomId('ticket_description')
            .setLabel('Descrição Detalhada')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Forneça todos os detalhes relevantes...')
            .setRequired(true)
            .setMaxLength(4000);

        const priorityInput = new TextInputBuilder()
            .setCustomId('ticket_priority')
            .setLabel('Prioridade (P0, P1, P2, P3)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('P0 (crítico), P1 (alta), P2 (média), P3 (baixa)')
            .setRequired(true)
            .setMaxLength(20);

        const row1 = new ActionRowBuilder().addComponents(titleInput);
        const row2 = new ActionRowBuilder().addComponents(descriptionInput);
        const row3 = new ActionRowBuilder().addComponents(priorityInput);

        modal.addComponents(row1, row2, row3);

        await interaction.showModal(modal);
    }

    // Handle modal submissions
    if (interaction.isModalSubmit() && interaction.customId.startsWith('modal_')) {
        // Defer the reply immediately to prevent timeout
        await interaction.deferReply({ ephemeral: true });

        const [, team, ticketType] = interaction.customId.split('_');
        const title = interaction.fields.getTextInputValue('ticket_title');
        const description = interaction.fields.getTextInputValue('ticket_description');
        const priority = interaction.fields.getTextInputValue('ticket_priority');

        await createTicket(interaction, team, ticketType, title, description, priority);
    }

        // Handle verification
        if (interaction.isButton() && interaction.customId === 'verify_accept') {
            await handleVerification(interaction);
        }

        // Handle department selection (onboarding)
        if (interaction.isButton() && interaction.customId.startsWith('onboard_')) {
            await handleDepartmentSelection(interaction);
        }

        // Handle onboarding approval/rejection
        if (interaction.isButton() && interaction.customId.startsWith('onboarding_')) {
            await handleOnboardingApproval(interaction);
        }

        // Handle "take ticket" button
        if (interaction.isButton() && interaction.customId.startsWith('take_')) {
            const ticketId = interaction.customId.replace('take_', '');
            await takeTicket(interaction, ticketId);
        }

        // Handle ticket status updates
        if (interaction.isButton() && interaction.customId.startsWith('update_')) {
            const [, action, ticketId] = interaction.customId.split('_');
            await updateTicketStatus(interaction, action, ticketId);
        }

        // Handle SLA pause/resume
        if (interaction.isButton() && interaction.customId.startsWith('sla_')) {
            const [, action, ticketId] = interaction.customId.split('_');
            await handleSLAControl(interaction, action, ticketId);
        }

        // Handle tag management buttons
        if (interaction.isButton() && interaction.customId.startsWith('tag_')) {
            const [, action, ticketId] = interaction.customId.split('_');
            await handleTagManagement(interaction, action, ticketId);
        }

        // Handle tag selection from menu (add tag)
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tag_select_')) {
            const ticketId = interaction.customId.replace('tag_select_', '');
            const selectedTag = interaction.values[0];

            const ticket = activeTickets.get(ticketId);
            if (!ticket) {
                await interaction.reply({ content: '❌ Ticket não encontrado!', ephemeral: true });
                return;
            }

            // Add the tag
            const success = addTagToTicket(ticketId, selectedTag);
            if (success) {
                await interaction.reply({
                    content: `✅ Tag **${TICKET_TAGS[selectedTag].emoji} ${TICKET_TAGS[selectedTag].label}** adicionada ao ticket \`${ticketId}\`!`,
                    ephemeral: true
                });

                // Refresh ticket message to show new tag
                await refreshTicketMessage(interaction.guild, ticketId);
            } else {
                await interaction.reply({
                    content: '❌ Esta tag já está adicionada ao ticket!',
                    ephemeral: true
                });
            }
        }

        // Handle tag selection from menu (remove tag)
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('tag_remove_select_')) {
            const ticketId = interaction.customId.replace('tag_remove_select_', '');
            const selectedTag = interaction.values[0];

            const ticket = activeTickets.get(ticketId);
            if (!ticket) {
                await interaction.reply({ content: '❌ Ticket não encontrado!', ephemeral: true });
                return;
            }

            // Remove the tag
            const success = removeTagFromTicket(ticketId, selectedTag);
            if (success) {
                await interaction.reply({
                    content: `✅ Tag **${TICKET_TAGS[selectedTag].emoji} ${TICKET_TAGS[selectedTag].label}** removida do ticket \`${ticketId}\`!`,
                    ephemeral: true
                });

                // Refresh ticket message to show updated tags
                await refreshTicketMessage(interaction.guild, ticketId);
            } else {
                await interaction.reply({
                    content: '❌ Esta tag não está no ticket!',
                    ephemeral: true
                });
            }
        }

        // Handle merge duplicate check
        if (interaction.isButton() && interaction.customId.startsWith('merge_')) {
            const [, action, ticketId] = interaction.customId.split('_');
            await handleMergeCheck(interaction, ticketId);
        }
    } catch (error) {
        // Security: Don't leak internal errors to users
        logSecurityEvent('ERROR', interaction?.user?.id || 'unknown', `Error: ${error.message}`);
        console.error('❌ Error handling interaction:', error);

        // Generic error message
        const errorMsg = '❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente ou contate um administrador.';

        if (interaction.deferred || interaction.replied) {
            await interaction.editReply(errorMsg).catch(() => {});
        } else {
            await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
        }
    }
});

async function createTicket(interaction, team, type, title, description, priority) {
    const userId = interaction.user.id;
    const guild = interaction.guild;
    const member = interaction.member;
    const teamConfig = TEAMS[team];

    // Security: Check rate limit
    const rateLimitCheck = checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
        logSecurityEvent('RATE_LIMIT', userId, `Blocked - ${rateLimitCheck.remainingTime}s remaining`);
        await interaction.editReply(
            `⚠️ **Limite de criação de tickets atingido!**\n\n` +
            `Você pode criar apenas ${MAX_TICKETS_PER_WINDOW} tickets por minuto.\n` +
            `Tente novamente em **${rateLimitCheck.remainingTime} segundos**.`
        );
        return;
    }

    // Security: Sanitize all inputs
    title = sanitizeInput(title);
    description = sanitizeInput(description);
    priority = sanitizeInput(priority);

    // Validate inputs are not empty after sanitization
    if (!title || !description || !priority) {
        logSecurityEvent('INVALID_INPUT', userId, 'Empty input after sanitization');
        await interaction.editReply('❌ Entrada inválida detectada. Por favor, use apenas texto normal.');
        return;
    }

    // Validate input lengths
    if (title.length < 3) {
        await interaction.editReply('❌ O título deve ter pelo menos 3 caracteres!');
        return;
    }

    if (description.length < 10) {
        await interaction.editReply('❌ A descrição deve ter pelo menos 10 caracteres!');
        return;
    }

    const ticketId = `${team}-${Date.now()}`;

    // Validate and normalize priority (accept variations)
    const priorityInput = priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Map variations to standard keys (P0-P3 system)
    const priorityMap = {
        'p0': 'p0', '0': 'p0', 'critico': 'p0', 'crítico': 'p0', 'critical': 'p0',
        'p1': 'p1', '1': 'p1', 'alta': 'p1', 'high': 'p1', 'h': 'p1',
        'p2': 'p2', '2': 'p2', 'media': 'p2', 'média': 'p2', 'medium': 'p2', 'm': 'p2',
        'p3': 'p3', '3': 'p3', 'baixa': 'p3', 'low': 'p3', 'l': 'p3', 'b': 'p3'
    };

    const priorityKey = priorityMap[priorityInput];

    if (!priorityKey) {
        await interaction.editReply('❌ Prioridade inválida! Use: **P0** (crítico), **P1** (alta), **P2** (média) ou **P3** (baixa)');
        return;
    }

    const slaConfig = SLA_CONFIG[priorityKey];

    // Check if user can create "Alta" priority tickets
    if (slaConfig.canCreate.length > 0) {
        const memberRoles = member.roles.cache.map(r => r.name);
        const hasPermission = slaConfig.canCreate.some(role => memberRoles.includes(role));

        if (!hasPermission) {
            await interaction.editReply(
                `❌ Apenas **Leads, CEO e Dev Master** podem criar tickets de prioridade **${slaConfig.label}**!\n\n` +
                `Por favor, use prioridade **Média** ou **Baixa**.`
            );
            return;
        }
    }

    // Find the team category first
    const category = guild.channels.cache.find(c => c.name === teamConfig.category && c.type === ChannelType.GuildCategory);

    if (!category) {
        await interaction.editReply(`❌ Categoria ${teamConfig.category} não encontrada!`);
        return;
    }

    // Find channels within the category
    const openChannel = guild.channels.cache.find(c => c.name === teamConfig.openChannel && c.parentId === category.id);
    const dashboardChannel = guild.channels.cache.find(c => c.name === teamConfig.dashboardChannel && c.parentId === category.id);
    const masterDashboard = guild.channels.cache.find(c => c.name === '📊-dashboard-geral');

    if (!openChannel) {
        await interaction.editReply('❌ Canal de tickets não encontrado!');
        return;
    }

    // Calculate SLA deadline
    const slaHours = slaConfig.hours;
    const slaDeadline = Date.now() + (slaHours * 60 * 60 * 1000);
    const slaTimestamp = Math.floor(slaDeadline / 1000);
    const createdAt = Date.now();

    // Create and store ticket object FIRST so we can use it for buttons and color
    const ticket = {
        messageId: null,  // Will be set after message is sent
        channelId: openChannel.id,
        threadId: null,   // Will be set after thread is created
        notificationMessageId: null,
        creator: member.id,
        team,
        type,
        title,
        description,
        priority,
        priorityKey,
        status: 'open',
        createdAt,
        slaDeadline,
        slaHours,
        slaBreached: false,
        slaPaused: false,
        slaPausedAt: null,
        firstResponse: null,
        tags: []  // Initialize empty tags array
    };

    activeTickets.set(ticketId, ticket);

    // Get initial color (will be base color since ticket is brand new)
    const embedColor = getSLAColor(ticket);

    // Create ticket embed
    const ticketEmbed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(`${TICKET_TYPES[type].emoji} ${title}`)
        .setDescription(description)
        .addFields(
            { name: '👤 Criado por', value: `<@${member.id}>`, inline: true },
            { name: '🏷️ Equipe', value: `${teamConfig.emoji} ${teamConfig.name}`, inline: true },
            { name: '📊 Status', value: '🟡 Aberto', inline: true },
            { name: '⚡ Prioridade', value: `${slaConfig.emoji} ${slaConfig.label} (SLA: ${slaHours}h)`, inline: true },
            { name: '🏷️ Tipo', value: `${TICKET_TYPES[type].emoji} ${TICKET_TYPES[type].name}`, inline: true },
            { name: '🏷️ Tags', value: getTagsString(ticket), inline: true },
            { name: '🆔 ID', value: `\`${ticketId}\``, inline: true },
            { name: '📅 Criado em', value: `<t:${Math.floor(createdAt / 1000)}:f>`, inline: true },
            { name: '⏰ SLA Deadline', value: `<t:${slaTimestamp}:R> (<t:${slaTimestamp}:f>)`, inline: true }
        )
        .setFooter({ text: 'Use os botões abaixo para atualizar o status' })
        .setTimestamp();

    // Create action buttons with ticket object for management controls
    const buttonRows = createTicketButtons(ticketId, 'open', ticket);

    const ticketMessage = await openChannel.send({ embeds: [ticketEmbed], components: buttonRows });

    // Ping team roles to notify about new ticket
    const roleMentions = teamConfig.notifyRoles
        .map(roleName => {
            const role = guild.roles.cache.find(r => r.name === roleName);
            return role ? `<@&${role.id}>` : null;
        })
        .filter(mention => mention !== null)
        .join(' ');

    // Send notification and store message ID for later deletion
    let notificationMessageId = null;
    if (roleMentions) {
        const notificationMessage = await openChannel.send(
            `🔔 **Novo ticket criado!**\n\n` +
            `${roleMentions}\n\n` +
            `**Equipe:** ${teamConfig.emoji} ${teamConfig.name}\n` +
            `**Tipo:** ${TICKET_TYPES[type].emoji} ${TICKET_TYPES[type].name}\n` +
            `**Prioridade:** ${slaConfig.emoji} ${slaConfig.label}\n` +
            `**ID:** \`${ticketId}\`\n\n` +
            `👆 Clique em "Assumir Ticket" para começar a trabalhar neste ticket.`
        );
        notificationMessageId = notificationMessage.id;
    }

    // Create a thread for this ticket so the creator can follow up
    const thread = await ticketMessage.startThread({
        name: `${TICKET_TYPES[type].emoji} ${title.substring(0, 80)}`, // Thread name max 100 chars
        autoArchiveDuration: 10080, // 7 days
        reason: `Ticket criado por ${member.user.tag}`,
    });

    // Send welcome message in thread - mentioning gives notification
    const welcomeMsg = await thread.send(
        `🎫 **Ticket criado!**\n\n` +
        `<@${member.id}>, use esta thread para acompanhar e discutir este ticket.\n` +
        `A equipe ${teamConfig.emoji} **${teamConfig.name}** irá responder em breve.\n\n` +
        `**ID:** \`${ticketId}\`\n` +
        `**Prioridade:** ${priority.toUpperCase()}`
    );

    // Try to add user to thread members for better visibility (with error handling)
    try {
        await thread.members.add(member.id);
        console.log(`✅ Added ${member.user.tag} to thread ${ticketId}`);
    } catch (error) {
        // If adding fails, the mention in the message should still work
        console.log(`⚠️  Could not add user to thread members (${error.message}), but mention should work`);
    }

    // Update ticket with messageId, threadId, and notificationMessageId
    ticket.messageId = ticketMessage.id;
    ticket.threadId = thread.id;
    ticket.notificationMessageId = notificationMessageId;
    activeTickets.set(ticketId, ticket);

    // Send confirmation
    await interaction.editReply(
        `✅ Ticket criado com sucesso! ID: \`${ticketId}\`\n\n` +
        `📋 Acompanhe em: <#${openChannel.id}>\n` +
        `💬 Thread: <#${thread.id}>`
    );

    // Send DM to ticket creator with ticket information
    try {
        const dmEmbed = new EmbedBuilder()
            .setColor(teamConfig.color)
            .setTitle(`${teamConfig.emoji} Ticket Criado - ${teamConfig.name}`)
            .setDescription(`Seu ticket foi criado com sucesso!`)
            .addFields(
                { name: '🎫 ID do Ticket', value: `\`${ticketId}\``, inline: true },
                { name: '📋 Tipo', value: `${TICKET_TYPES[type].emoji} ${TICKET_TYPES[type].name}`, inline: true },
                { name: '🎯 Prioridade', value: `${getSLAConfig(priority).emoji} ${getSLAConfig(priority).label}`, inline: true },
                { name: '📌 Título', value: title },
                { name: '📝 Descrição', value: description.substring(0, 1000) },
                { name: '🔗 Thread', value: `<#${thread.id}>` },
                { name: '⏰ Status', value: '🟡 Aberto - Aguardando atendimento' }
            )
            .setTimestamp()
            .setFooter({ text: 'Você receberá atualizações sobre este ticket via DM' });

        await interaction.user.send({ embeds: [dmEmbed] });
    } catch (error) {
        console.log(`⚠️  Could not DM user (DMs may be disabled): ${error.message}`);
    }

    // Update dashboards
    await updateTeamDashboard(guild, team);
    await updateMasterDashboard(guild);
}

async function takeTicket(interaction, ticketId) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;
    const ticket = activeTickets.get(ticketId);

    if (!ticket) {
        await interaction.editReply('❌ Ticket não encontrado!');
        return;
    }

    // Check if already assigned
    if (ticket.assignee) {
        await interaction.editReply(`❌ Este ticket já foi assumido por <@${ticket.assignee}>!`);
        return;
    }

    const teamConfig = TEAMS[ticket.team];
    const category = guild.channels.cache.find(c => c.name === teamConfig.category && c.type === ChannelType.GuildCategory);

    if (!category) {
        await interaction.editReply('❌ Categoria da equipe não encontrada!');
        return;
    }

    // Assign ticket
    ticket.assignee = member.id;
    ticket.status = 'progress';

    // Get channels
    const currentChannel = guild.channels.cache.get(ticket.channelId);
    const progressChannel = guild.channels.cache.find(c => c.name === teamConfig.progressChannel && c.parentId === category.id);

    if (!progressChannel) {
        await interaction.editReply('❌ Canal de tickets em andamento não encontrado!');
        return;
    }

    // Get original message
    const originalMessage = await currentChannel.messages.fetch(ticket.messageId).catch(() => null);

    if (!originalMessage) {
        await interaction.editReply('❌ Mensagem original não encontrada!');
        return;
    }

    // Update embed to show assignee
    const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
        .setColor('#FFA500')
        .spliceFields(2, 1, { name: '📊 Status', value: '⏳ Em Andamento', inline: true })
        .addFields({ name: '👤 Responsável', value: `<@${member.id}>`, inline: true });

    // Update buttons for "progress" status
    const newButtons = createTicketButtons(ticketId, 'progress', ticket);

    // Move to progress channel
    const newMessage = await progressChannel.send({ embeds: [updatedEmbed], components: newButtons });

    // Delete from old channel
    await originalMessage.delete().catch(() => {});

    // Delete notification message to avoid channel pollution
    if (ticket.notificationMessageId) {
        const notificationMessage = await currentChannel.messages.fetch(ticket.notificationMessageId).catch((err) => {
            console.log(`⚠️  Could not fetch notification message ${ticket.notificationMessageId}: ${err.message}`);
            return null;
        });
        if (notificationMessage) {
            await notificationMessage.delete().catch((err) => {
                console.log(`⚠️  Could not delete notification message: ${err.message}`);
            });
            console.log(`🗑️  Deleted notification message for ticket ${ticketId}`);
        } else {
            console.log(`⚠️  Notification message not found for ticket ${ticketId}`);
        }
        ticket.notificationMessageId = null;
    } else {
        console.log(`ℹ️  No notification message ID stored for ticket ${ticketId} (might be old ticket)`);
    }

    // Update ticket info
    ticket.channelId = progressChannel.id;
    ticket.messageId = newMessage.id;

    // Check if work channel already exists (in archive or elsewhere)
    const workChannelName = `ticket-${ticketId.split('-')[1]}`;

    // Fetch fresh channel data from Discord API (cache might be stale)
    await guild.channels.fetch();
    let workChannel = guild.channels.cache.find(c => c.name === workChannelName);

    if (workChannel) {
        // Channel exists - move it back to team category
        await workChannel.setParent(category.id);
        console.log(`✅ Work channel moved back to ${category.name}`);
        await workChannel.send(
            `🔄 **Canal reativado!**\n\n` +
            `<@${member.id}> assumiu o ticket novamente.\n` +
            `Histórico de discussão preservado.`
        );
    } else {
        console.log(`📝 Creating new work channel: ${workChannelName}`);
        // Create new work channel (only visible to specific team members)
        workChannel = await guild.channels.create({
            name: workChannelName,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `🎫 Canal de trabalho para o ticket: ${ticket.title}`,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                ...teamConfig.teamRoles.map(roleName => {
                    const role = guild.roles.cache.find(r => r.name === roleName);
                    return role ? {
                        id: role.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                    } : null;
                }).filter(p => p !== null),
            ],
        });

        // Send welcome message in new work channel
        await workChannel.send(
            `🎫 **Canal de trabalho criado!**\n\n` +
            `**Ticket:** ${ticket.title}\n` +
            `**Responsável:** <@${member.id}>\n` +
            `**Criador:** <@${ticket.creator}>\n` +
            `**ID:** \`${ticketId}\`\n\n` +
            `Use este canal para discutir e trabalhar neste ticket com a equipe.`
        );
    }

    ticket.workChannelId = workChannel.id;

    // Update thread and unarchive if needed
    if (ticket.threadId) {
        const thread = guild.channels.cache.get(ticket.threadId);
        if (thread) {
            // Unarchive thread if it was archived
            if (thread.archived) {
                await thread.setArchived(false);
            }
            await thread.send(
                `👤 **Ticket assumido por** <@${member.id}>\n` +
                `📊 Status atualizado para: ⏳ Em Andamento\n` +
                `💬 Canal de trabalho criado: <#${workChannel.id}>`
            );
        }
    }

    // Send DM to ticket creator
    try {
        const creator = await guild.members.fetch(ticket.creator);
        const dmEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⏳ Seu Ticket foi Assumido!')
            .setDescription(
                `Seu ticket **${ticket.title}** foi assumido por um membro da equipe.\n\n` +
                `**ID:** \`${ticketId}\`\n` +
                `**Equipe:** ${teamConfig.emoji} ${teamConfig.name}\n` +
                `**Assumido por:** <@${member.id}>\n` +
                `**Canal de trabalho:** <#${workChannel.id}>\n\n` +
                `A equipe está trabalhando no seu ticket agora!`
            )
            .setTimestamp();

        await creator.send({ embeds: [dmEmbed] });
        console.log(`✅ Sent assignment DM to ${creator.user.tag} for ticket ${ticketId}`);
    } catch (error) {
        console.log(`⚠️  Could not DM ticket creator: ${error.message}`);
    }

    await interaction.editReply(`✅ Você assumiu o ticket! Canal de trabalho: <#${workChannel.id}>\n\n💬 O criador <@${ticket.creator}> foi notificado via DM.`);

    // Update dashboards
    await updateTeamDashboard(guild, ticket.team);
    await updateMasterDashboard(guild);
}

async function updateTicketStatus(interaction, action, ticketId) {
    // Defer reply immediately to prevent timeout
    await interaction.deferReply({ ephemeral: true });

    const ticket = activeTickets.get(ticketId);

    if (!ticket) {
        await interaction.editReply({ content: '❌ Ticket não encontrado!' });
        return;
    }

    const guild = interaction.guild;
    const teamConfig = TEAMS[ticket.team];

    // Find the team category
    const category = guild.channels.cache.find(c => c.name === teamConfig.category && c.type === ChannelType.GuildCategory);

    if (!category) {
        await interaction.editReply({ content: '❌ Categoria não encontrada!' });
        return;
    }

    let targetChannel;
    let status;
    let statusEmoji;
    let statusColor;

    switch (action) {
        case 'progress':
            targetChannel = guild.channels.cache.find(c => c.name === teamConfig.progressChannel && c.parentId === category.id);
            status = 'Em Andamento';
            statusEmoji = '⏳';
            statusColor = '#FFA500';
            ticket.status = 'progress';
            break;
        case 'resolved':
            targetChannel = guild.channels.cache.find(c => c.name === teamConfig.resolvedChannel && c.parentId === category.id);
            status = 'Resolvido';
            statusEmoji = '✅';
            statusColor = '#00FF00';
            ticket.status = 'resolved';
            break;
        case 'reopen':
            targetChannel = guild.channels.cache.find(c => c.name === teamConfig.openChannel && c.parentId === category.id);
            status = 'Aberto';
            statusEmoji = '🟡';
            statusColor = getPriorityColor(ticket.priority);
            ticket.status = 'open';
            break;
    }

    if (!targetChannel) {
        await interaction.editReply({ content: '❌ Canal de destino não encontrado!' });
        return;
    }

    // Get original message
    const currentChannel = guild.channels.cache.get(ticket.channelId);
    const originalMessage = await currentChannel.messages.fetch(ticket.messageId).catch(() => null);

    if (!originalMessage) {
        await interaction.editReply({ content: '❌ Mensagem original não encontrada!' });
        return;
    }

    // Update embed
    const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
        .setColor(statusColor)
        .spliceFields(2, 1, { name: '📊 Status', value: `${statusEmoji} ${status}`, inline: true });

    // Update buttons based on new status
    const newButtons = createTicketButtons(ticketId, ticket.status, ticket);

    // For resolved tickets, keep it in resolved channel (don't delete the message)
    if (action === 'resolved') {
        // Archive thread BEFORE deleting the message (threads are attached to messages)
        // Note: Don't send a message before archiving - Discord automatically unarchives threads when new messages are sent
        if (ticket.threadId) {
            const thread = guild.channels.cache.get(ticket.threadId);
            if (thread && !thread.archived) {
                await thread.setArchived(true);
                console.log(`✅ Archived thread ${ticket.threadId} for resolved ticket ${ticketId}`);
            }
        }

        // Move to resolved channel
        const newMessage = await targetChannel.send({ embeds: [updatedEmbed], components: newButtons });

        // Delete from old channel
        await originalMessage.delete().catch(() => {});

        // Move work channel to archive if it exists
        if (ticket.workChannelId) {
            const workChannel = guild.channels.cache.get(ticket.workChannelId);
            if (workChannel) {
                const archiveCategory = guild.channels.cache.find(c => c.name === '📦 ARQUIVO DE TICKETS' && c.type === ChannelType.GuildCategory);
                if (archiveCategory) {
                    await workChannel.setParent(archiveCategory.id);
                    await workChannel.send(
                        `🗄️ **Canal arquivado**\n\n` +
                        `Ticket resolvido por <@${interaction.user.id}>.\n` +
                        `Histórico preservado. Se o ticket for reaberto, este canal será restaurado.`
                    );
                }
            }
        }

        // Update ticket info
        ticket.channelId = targetChannel.id;
        ticket.messageId = newMessage.id;

        // Initialize auto-close tracking for resolved ticket
        if (AUTO_CLOSE_CONFIG.enabled) {
            resolvedTickets.set(ticketId, {
                resolvedAt: Date.now(),
                warnedAt: null,
                closedAt: null
            });
            console.log(`⏰ Started auto-close tracking for ticket ${ticketId}`);
        }

        // Send DM to ticket creator
        try {
            const creator = await guild.members.fetch(ticket.creator);
            const dmEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Seu Ticket foi Resolvido!')
                .setDescription(
                    `Seu ticket **${ticket.title}** foi marcado como resolvido.\n\n` +
                    `**ID:** \`${ticketId}\`\n` +
                    `**Equipe:** ${teamConfig.emoji} ${teamConfig.name}\n` +
                    `**Resolvido por:** <@${interaction.user.id}>\n\n` +
                    `Obrigado por usar nosso sistema de suporte!`
                )
                .setTimestamp();

            await creator.send({ embeds: [dmEmbed] });
            console.log(`✅ Sent resolution DM to ${creator.user.tag} for ticket ${ticketId}`);
        } catch (error) {
            console.log(`⚠️  Could not DM ticket creator: ${error.message}`);
        }

        // Reply to interaction (ephemeral - only visible to who resolved)
        await interaction.editReply({
            content: `✅ Ticket marcado como resolvido! O criador <@${ticket.creator}> foi notificado via DM.`
        });
    } else if (action === 'reopen') {
        // Reopen ticket - move back to open, clear assignee
        ticket.assignee = null;

        // Remove auto-close tracking (ticket is being reopened)
        if (resolvedTickets.has(ticketId)) {
            resolvedTickets.delete(ticketId);
            console.log(`⏰ Removed auto-close tracking for reopened ticket ${ticketId}`);
        }

        // Move work channel to archive if it exists
        if (ticket.workChannelId) {
            const workChannel = guild.channels.cache.get(ticket.workChannelId);
            if (workChannel) {
                const archiveCategory = guild.channels.cache.find(c => c.name === '📦 ARQUIVO DE TICKETS' && c.type === ChannelType.GuildCategory);
                if (archiveCategory) {
                    await workChannel.setParent(archiveCategory.id);
                    await workChannel.send(
                        `🗄️ **Canal arquivado**\n\n` +
                        `Ticket reaberto e voltou para a fila.\n` +
                        `Histórico preservado. Se o ticket for assumido novamente, este canal será restaurado.`
                    );
                }
            }
        }

        const newMessage = await targetChannel.send({ embeds: [updatedEmbed], components: newButtons });
        await originalMessage.delete().catch(() => {});

        ticket.channelId = targetChannel.id;
        ticket.messageId = newMessage.id;

        // Unarchive thread so it's visible again
        if (ticket.threadId) {
            const thread = guild.channels.cache.get(ticket.threadId);
            if (thread && thread.archived) {
                await thread.setArchived(false);
                await thread.send(
                    `🔄 **Thread reaberta**\n\n` +
                    `Ticket reaberto por <@${interaction.user.id}>.\n` +
                    `Ticket voltou para a fila de tickets abertos.`
                );
            }
        }

        await interaction.reply({
            content: `✅ Ticket reaberto! <@${ticket.creator}>`,
            ephemeral: false
        });
    } else {
        // Other status changes (shouldn't happen with new workflow, but keep as fallback)
        const newMessage = await targetChannel.send({ embeds: [updatedEmbed], components: newButtons });
        await originalMessage.delete().catch(() => {});

        ticket.channelId = targetChannel.id;
        ticket.messageId = newMessage.id;

        await interaction.reply({
            content: `✅ Ticket movido para **${status}**! <@${ticket.creator}>`,
            ephemeral: false
        });
    }

    // Update thread with status change (skip for resolved/reopen as they handle their own thread updates)
    if (ticket.threadId && action !== 'resolved' && action !== 'reopen') {
        const thread = guild.channels.cache.get(ticket.threadId);
        if (thread && !thread.archived) {
            await thread.send(
                `📊 **Status atualizado por** <@${interaction.user.id}>\n` +
                `**Novo status:** ${statusEmoji} ${status}`
            );
        }
    }

    // Update dashboards
    await updateTeamDashboard(guild, ticket.team);
    await updateMasterDashboard(guild);
}

async function updateTeamDashboard(guild, team) {
    const teamConfig = TEAMS[team];

    // Find the team category
    const category = guild.channels.cache.find(c => c.name === teamConfig.category && c.type === ChannelType.GuildCategory);
    if (!category) return;

    const dashboardChannel = guild.channels.cache.find(c => c.name === teamConfig.dashboardChannel && c.parentId === category.id);

    if (!dashboardChannel) return;

    // Get all tickets for this team
    const teamTickets = Array.from(activeTickets.values()).filter(t => t.team === team);
    const openTickets = teamTickets.filter(t => t.status === 'open');
    const progressTickets = teamTickets.filter(t => t.status === 'progress');

    // Create dashboard embed
    const dashboardEmbed = new EmbedBuilder()
        .setColor(teamConfig.color)
        .setTitle(`${teamConfig.emoji} Dashboard ${teamConfig.name}`)
        .setDescription(`**Status dos tickets da equipe ${teamConfig.name}**`)
        .addFields(
            { name: '📊 Resumo', value: `🟡 Abertos: **${openTickets.length}**\n⏳ Em Andamento: **${progressTickets.length}**\n✅ Resolvidos: **${teamTickets.filter(t => t.status === 'resolved').length}**`, inline: false }
        )
        .setFooter({ text: `Atualizado em` })
        .setTimestamp();

    // Add open tickets
    if (openTickets.length > 0) {
        const openList = openTickets.slice(0, 5).map(t =>
            `${TICKET_TYPES[t.type].emoji} **${t.title}** - \`${t.ticketId || 'N/A'}\`\n⚡ ${t.priority} | <@${t.creator}>`
        ).join('\n\n');
        dashboardEmbed.addFields({ name: '🟡 Tickets Abertos', value: openList || 'Nenhum', inline: false });
    }

    // Add in-progress tickets
    if (progressTickets.length > 0) {
        const progressList = progressTickets.slice(0, 5).map(t =>
            `${TICKET_TYPES[t.type].emoji} **${t.title}** - \`${t.ticketId || 'N/A'}\`\n⚡ ${t.priority} | <@${t.creator}>`
        ).join('\n\n');
        dashboardEmbed.addFields({ name: '⏳ Tickets em Andamento', value: progressList || 'Nenhum', inline: false });
    }

    // Clear and send
    const messages = await dashboardChannel.messages.fetch({ limit: 10 });
    await dashboardChannel.bulkDelete(messages).catch(() => {});
    await dashboardChannel.send({ embeds: [dashboardEmbed] });
}

async function updateMasterDashboard(guild) {
    const masterDashboard = guild.channels.cache.find(c => c.name === '📊-dashboard-geral');

    if (!masterDashboard) return;

    // Get all tickets
    const allTickets = Array.from(activeTickets.values());
    const openTickets = allTickets.filter(t => t.status === 'open');
    const progressTickets = allTickets.filter(t => t.status === 'progress');
    const resolvedTickets = allTickets.filter(t => t.status === 'resolved');
    const totalTickets = allTickets.length;

    // Calculate overall metrics
    const completionRate = totalTickets > 0 ? Math.round((resolvedTickets.length / totalTickets) * 100) : 0;
    const slaBreached = allTickets.filter(t => t.slaBreached).length;

    // Priority breakdown (normalize to handle legacy priorities)
    const p0Count = allTickets.filter(t => normalizePriority(t.priority) === 'p0').length;
    const p1Count = allTickets.filter(t => normalizePriority(t.priority) === 'p1').length;
    const p2Count = allTickets.filter(t => normalizePriority(t.priority) === 'p2').length;
    const p3Count = allTickets.filter(t => normalizePriority(t.priority) === 'p3').length;

    // Build progress bar for completion rate
    const barLength = 20;
    const filledBars = Math.round((completionRate / 100) * barLength);
    const emptyBars = barLength - filledBars;
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);

    // Create main dashboard embed
    const dashboardEmbed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle('📊 Dashboard Geral - Sistema de Tickets UltraCreators')
        .setDescription(
            `**📈 Visão Geral do Sistema**\n` +
            `**Total de Tickets:** ${totalTickets} | **Taxa de Conclusão:** ${completionRate}%\n` +
            `${progressBar} ${completionRate}%\n\n` +
            `🟡 **Abertos:** ${openTickets.length} | ` +
            `⏳ **Em Andamento:** ${progressTickets.length} | ` +
            `✅ **Resolvidos:** ${resolvedTickets.length}\n` +
            `${slaBreached > 0 ? `⚠️ **SLA Violados:** ${slaBreached}` : '✅ **Nenhuma violação de SLA**'}\n\n` +
            `**🎯 Distribuição por Prioridade:**\n` +
            `${SLA_CONFIG.p0.emoji} **P0 - Crítico:** ${p0Count} | ` +
            `${SLA_CONFIG.p1.emoji} **P1 - Alta:** ${p1Count} | ` +
            `${SLA_CONFIG.p2.emoji} **P2 - Média:** ${p2Count} | ` +
            `${SLA_CONFIG.p3.emoji} **P3 - Baixa:** ${p3Count}`
        )
        .setTimestamp()
        .setFooter({ text: `Última atualização` });

    // Add team sections
    for (const [teamKey, teamConfig] of Object.entries(TEAMS)) {
        const teamTickets = allTickets.filter(t => t.team === teamKey);
        const teamOpen = teamTickets.filter(t => t.status === 'open').length;
        const teamProgress = teamTickets.filter(t => t.status === 'progress').length;
        const teamResolved = teamTickets.filter(t => t.status === 'resolved').length;
        const teamTotal = teamTickets.length;
        const teamSLA = teamTickets.filter(t => t.slaBreached).length;

        // Team completion rate
        const teamCompletionRate = teamTotal > 0 ? Math.round((teamResolved / teamTotal) * 100) : 0;
        const teamBarLength = 10;
        const teamFilledBars = Math.round((teamCompletionRate / 100) * teamBarLength);
        const teamEmptyBars = teamBarLength - teamFilledBars;
        const teamProgressBar = '█'.repeat(teamFilledBars) + '░'.repeat(teamEmptyBars);

        // Priority breakdown for team (normalize to handle legacy priorities)
        const teamP0 = teamTickets.filter(t => normalizePriority(t.priority) === 'p0').length;
        const teamP1 = teamTickets.filter(t => normalizePriority(t.priority) === 'p1').length;
        const teamP2 = teamTickets.filter(t => normalizePriority(t.priority) === 'p2').length;
        const teamP3 = teamTickets.filter(t => normalizePriority(t.priority) === 'p3').length;

        const teamValue =
            `**Status:** 🟡 ${teamOpen} | ⏳ ${teamProgress} | ✅ ${teamResolved}\n` +
            `**Conclusão:** ${teamProgressBar} ${teamCompletionRate}%\n` +
            `**Prioridades:** ${teamP0>0?`🔥${teamP0}`:''} ${teamP1>0?`🔴${teamP1}`:''} ${teamP2>0?`🟠${teamP2}`:''} ${teamP3>0?`🟢${teamP3}`:''}\n` +
            `${teamSLA > 0 ? `⚠️ **SLA Violados:** ${teamSLA}` : '✅ **SLAs OK**'}`;

        dashboardEmbed.addFields({
            name: `${teamConfig.emoji} ${teamConfig.name.toUpperCase()} - ${teamTotal} tickets`,
            value: teamValue,
            inline: true
        });
    }

    // Add recent active tickets
    const recentActiveTickets = allTickets
        .filter(t => t.status !== 'resolved')
        .sort((a, b) => {
            // Sort by priority first (P0 > P1 > P2 > P3), then by creation time
            const priorityOrder = { p0: 0, p1: 1, p2: 2, p3: 3 };
            const aPriority = normalizePriority(a.priority);
            const bPriority = normalizePriority(b.priority);
            const priorityDiff = priorityOrder[aPriority] - priorityOrder[bPriority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.createdAt - a.createdAt;
        })
        .slice(0, 5);

    if (recentActiveTickets.length > 0) {
        const recentList = recentActiveTickets
            .filter(t => t.ticketId && t.title && t.type && t.team) // Filter out invalid tickets
            .map(t => {
                const teamConfig = TEAMS[t.team];
                const slaConfig = getSLAConfig(t.priority); // Use helper to handle legacy priorities
                const statusEmoji = t.status === 'open' ? '🟡' : '⏳';
                const slaWarning = t.slaBreached ? '⚠️' : '';
                const ticketShortId = t.ticketId.includes('-') ? t.ticketId.split('-')[1] : t.ticketId;
                return `${statusEmoji} ${slaConfig.emoji} ${teamConfig.emoji} **${t.title.substring(0, 40)}${t.title.length > 40 ? '...' : ''}**\n` +
                       `   ${TICKET_TYPES[t.type].emoji} ${slaConfig.shortLabel} | ID: \`${ticketShortId}\` ${slaWarning}`;
            }).join('\n');

        dashboardEmbed.addFields({
            name: '🔥 Tickets Ativos Prioritários (Top 5)',
            value: recentList,
            inline: false
        });
    }

    // Clear and send
    const messages = await masterDashboard.messages.fetch({ limit: 10 });
    await masterDashboard.bulkDelete(messages).catch(() => {});
    await masterDashboard.send({ embeds: [dashboardEmbed] });
}

async function updateAllDashboards(guild) {
    for (const team of Object.keys(TEAMS)) {
        await updateTeamDashboard(guild, team);
    }
    await updateMasterDashboard(guild);
}

function getPriorityColor(priority) {
    const priorityKey = priority.toLowerCase();
    // Use SLA_CONFIG for colors
    return SLA_CONFIG[priorityKey]?.color || '#808080';
}

// Helper function to normalize legacy priorities to new P0-P3 format
function normalizePriority(priority) {
    const priorityLower = priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

    // Map legacy priorities to new format
    const legacyMap = {
        'alta': 'p1',
        'media': 'p2',
        'média': 'p2',
        'baixa': 'p3'
    };

    return legacyMap[priorityLower] || priorityLower;
}

// Helper function to get SLA config with legacy support
function getSLAConfig(priority) {
    const normalizedPriority = normalizePriority(priority);
    return SLA_CONFIG[normalizedPriority] || SLA_CONFIG.p3; // Default to P3 if not found
}

async function handleVerification(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const member = interaction.member;

        // Get the Ultra role
        const ultraRole = guild.roles.cache.find(r => r.name === '✅ Ultra');

        if (!ultraRole) {
            await interaction.editReply('❌ Role Ultra não encontrada! Contate um administrador.');
            logSecurityEvent('VERIFICATION_ERROR', member.id, 'Ultra role not found');
            return;
        }

        // Check if user already has the role
        if (member.roles.cache.has(ultraRole.id)) {
            await interaction.editReply('✅ Você já está verificado e tem acesso aos canais!');
            return;
        }

        // Assign the Ultra role
        await member.roles.add(ultraRole);

        logSecurityEvent('VERIFICATION', member.id, `User verified: ${member.user.tag}`);
        console.log(`✅ Usuário verificado: ${member.user.tag}`);

        // Check if user has any Ops/Creator roles
        const departmentRoles = [
            '🟡 Commercial Ops',
            '🟡 Coordination Ops',
            '🟡 Social Media',
            '🟡 Recruitment Ops',
            '🎬 Criador de Conteúdo',
            '💻 DevOps'
        ];

        const hasDepartmentRole = member.roles.cache.some(role =>
            departmentRoles.includes(role.name)
        );

        if (!hasDepartmentRole) {
            // User needs to choose a department - redirect to onboarding
            const onboardingChannel = guild.channels.cache.find(c => c.name === '🎯-escolher-departamento');

            await interaction.editReply(
                '🎉 **Verificação concluída com sucesso!**\n\n' +
                '✅ Você recebeu a tag **Ultra**!\n\n' +
                `📌 **Próximo passo:** Vá para ${onboardingChannel} e escolha o departamento onde você deseja trabalhar.\n\n` +
                'Após sua escolha, um líder de equipe irá revisar sua solicitação. ⏳'
            );

            logSecurityEvent('VERIFICATION_NEEDS_ONBOARDING', member.id, 'User verified, needs department selection');
        } else {
            // User already has a department role - full access
            await interaction.editReply(
                '🎉 **Parabéns! Você foi verificado com sucesso!**\n\n' +
                '✅ Você recebeu a tag **Ultra** e já tem acesso aos canais da sua equipe.\n\n' +
                '📌 Próximos passos:\n' +
                '• Vá para os canais da sua equipe\n' +
                '• Confira o <#💬-chat-geral>\n' +
                '• Explore os canais disponíveis\n\n' +
                '**Bem-vindo(a) à comunidade Ultra Creators!** 🚀'
            );

            // Send welcome message in chat-geral
            const chatGeral = guild.channels.cache.find(c => c.name === '💬-chat-geral');
            if (chatGeral) {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#00D9FF')
                    .setTitle('👋 Novo Membro Verificado!')
                    .setDescription(
                        `**${member.user.tag}** acabou de se juntar à comunidade!\n\n` +
                        `Bem-vindo(a), <@${member.id}>! 🎉`
                    )
                    .setThumbnail(member.user.displayAvatarURL())
                    .setTimestamp();

                await chatGeral.send({ embeds: [welcomeEmbed] });
            }
        }

    } catch (error) {
        console.error('❌ Error in handleVerification:', error);
        await interaction.editReply('❌ Ocorreu um erro ao verificar. Contate um administrador.').catch(() => {});
        logSecurityEvent('VERIFICATION_ERROR', interaction.user.id, `Error: ${error.message}`);
    }
}

async function handleDepartmentSelection(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const member = interaction.member;
        const department = interaction.customId.replace('onboard_', '');

        // Check if user already has a pending onboarding request
        const existingRequest = Array.from(onboardingTickets.values()).find(
            ticket => ticket.userId === member.id && ticket.status === 'pending'
        );

        if (existingRequest) {
            await interaction.editReply(
                '⚠️ **Você já tem uma solicitação pendente!**\n\n' +
                `Seu pedido para **${existingRequest.requestedDepartment}** está sendo analisado.\n` +
                'Aguarde a resposta do líder da equipe.'
            );
            return;
        }

        // Check if user already has a department role
        const departmentRoles = {
            commercial: '🟡 Commercial Ops',
            coordination: '🟡 Coordination Ops',
            socialmedia: '🟡 Social Media',
            recruitment: '🟡 Recruitment Ops',
            creator: '🎬 Criador de Conteúdo'
        };

        const hasDepartmentRole = member.roles.cache.some(role =>
            Object.values(departmentRoles).includes(role.name)
        );

        if (hasDepartmentRole) {
            await interaction.editReply(
                '❌ **Você já faz parte de um departamento!**\n\n' +
                'Não é possível se candidatar a outro departamento.'
            );
            return;
        }

        // Map department to role name and team lead
        const departmentConfig = {
            commercial: {
                roleName: '🟡 Commercial Ops',
                displayName: 'Commercial Ops',
                teamLead: '🟠 Commercial Lead',
                category: '💰 COMERCIAL',
                channelName: '📋-onboarding-requests',
                emoji: '💰'
            },
            coordination: {
                roleName: '🟡 Coordination Ops',
                displayName: 'Coordination Ops',
                teamLead: '🟠 Coordination Lead',
                category: '⚙️ COORDENAÇÃO',
                channelName: '📋-onboarding-requests',
                emoji: '⚙️'
            },
            socialmedia: {
                roleName: '🟡 Social Media',
                displayName: 'Social Media',
                teamLead: '🟠 Coordination Lead',
                category: '⚙️ COORDENAÇÃO',
                channelName: '📋-onboarding-requests',
                emoji: '📱'
            },
            recruitment: {
                roleName: '🟡 Recruitment Ops',
                displayName: 'Recruitment Ops',
                teamLead: '🟠 Recruitment Lead',
                category: '🎤 RECRUTAMENTO',
                channelName: '📋-onboarding-requests',
                emoji: '🎤'
            },
            creator: {
                roleName: '🎬 Criador de Conteúdo',
                displayName: 'Criador de Conteúdo',
                teamLead: '🟠 Recruitment Lead',
                category: '🎤 RECRUTAMENTO',
                channelName: '📋-onboarding-requests',
                emoji: '🎬'
            }
        };

        const config = departmentConfig[department];
        if (!config) {
            await interaction.editReply('❌ Departamento inválido!');
            return;
        }

        // Find onboarding channel for this team
        const category = guild.channels.cache.find(c => c.name === config.category && c.type === ChannelType.GuildCategory);
        if (!category) {
            await interaction.editReply('❌ Categoria não encontrada!');
            return;
        }

        const onboardingChannel = guild.channels.cache.find(
            c => c.name === config.channelName && c.parentId === category.id
        );

        if (!onboardingChannel) {
            await interaction.editReply('❌ Canal de onboarding não encontrado!');
            return;
        }

        // Create onboarding ticket
        const ticketId = `onboarding-${Date.now()}`;
        const joinedTimestamp = Math.floor(member.joinedTimestamp / 1000);

        const onboardingEmbed = new EmbedBuilder()
            .setColor('#00D9FF')
            .setTitle('📋 Nova Solicitação de Entrada')
            .setDescription(
                `Um novo membro deseja se juntar ao departamento **${config.displayName}**!`
            )
            .addFields(
                { name: '👤 Usuário', value: `${member} (${member.user.tag})`, inline: true },
                { name: '🆔 ID', value: member.id, inline: true },
                { name: '📅 Entrou no servidor', value: `<t:${joinedTimestamp}:R>`, inline: true },
                { name: '🎯 Departamento solicitado', value: `${config.emoji} **${config.displayName}**`, inline: false },
                { name: '🏷️ Cargo solicitado', value: config.roleName, inline: false },
                { name: '⏰ Solicitação criada', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
            )
            .setThumbnail(member.user.displayAvatarURL())
            .setFooter({ text: `Ticket ID: ${ticketId}` })
            .setTimestamp();

        // Create approval buttons
        const approvalRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`onboarding_approve_${ticketId}`)
                    .setLabel('Aprovar')
                    .setEmoji('✅')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`onboarding_reject_${ticketId}`)
                    .setLabel('Rejeitar')
                    .setEmoji('❌')
                    .setStyle(ButtonStyle.Danger)
            );

        // Send to onboarding channel
        const onboardingMessage = await onboardingChannel.send({
            embeds: [onboardingEmbed],
            components: [approvalRow]
        });

        // Ping the team lead
        const teamLeadRole = guild.roles.cache.find(r => r.name === config.teamLead);
        if (teamLeadRole) {
            await onboardingChannel.send(`📢 <@&${teamLeadRole.id}> - Nova solicitação de entrada!`);
        }

        // Store onboarding ticket
        onboardingTickets.set(ticketId, {
            ticketId,
            userId: member.id,
            username: member.user.tag,
            requestedRole: config.roleName,
            requestedDepartment: config.displayName,
            department,
            teamLead: config.teamLead,
            status: 'pending',
            createdAt: Date.now(),
            messageId: onboardingMessage.id,
            channelId: onboardingChannel.id,
            joinedAt: member.joinedTimestamp
        });

        // Send confirmation to user
        await interaction.editReply(
            '✅ **Solicitação enviada com sucesso!**\n\n' +
            `📋 Departamento: **${config.displayName}**\n` +
            `👤 Líder responsável: **${config.teamLead}**\n\n` +
            '⏳ Sua solicitação está sendo analisada. Você receberá uma notificação via DM quando houver uma resposta.\n\n' +
            'Enquanto isso, sinta-se à vontade para explorar os canais gerais!'
        );

        logSecurityEvent('ONBOARDING_REQUEST', member.id, `Department: ${config.displayName}`);
        console.log(`📋 Onboarding request created: ${ticketId} - ${member.user.tag} → ${config.displayName}`);

    } catch (error) {
        console.error('❌ Error in handleDepartmentSelection:', error);
        await interaction.editReply('❌ Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.').catch(() => {});
        logSecurityEvent('ONBOARDING_ERROR', interaction.user.id, `Error: ${error.message}`);
    }
}

async function handleOnboardingApproval(interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const guild = interaction.guild;
        const [, action, ticketId] = interaction.customId.split('_');

        // Get onboarding ticket
        const ticket = onboardingTickets.get(ticketId);

        if (!ticket) {
            await interaction.editReply('❌ Solicitação não encontrada!');
            return;
        }

        if (ticket.status !== 'pending') {
            await interaction.editReply(`⚠️ Esta solicitação já foi ${ticket.status === 'approved' ? 'aprovada' : 'rejeitada'}.`);
            return;
        }

        // Get the user
        const targetMember = await guild.members.fetch(ticket.userId).catch(() => null);

        if (!targetMember) {
            await interaction.editReply('❌ Usuário não encontrado no servidor!');
            // Clean up ticket
            onboardingTickets.delete(ticketId);
            return;
        }

        if (action === 'approve') {
            // Approve - assign role
            const role = guild.roles.cache.find(r => r.name === ticket.requestedRole);

            if (!role) {
                await interaction.editReply(`❌ Cargo **${ticket.requestedRole}** não encontrado!`);
                return;
            }

            // Assign the role
            await targetMember.roles.add(role);

            // Remove Ultra role - user should only have department role
            const ultraRole = guild.roles.cache.find(r => r.name === '✅ Ultra');
            if (ultraRole && targetMember.roles.cache.has(ultraRole.id)) {
                await targetMember.roles.remove(ultraRole);
                console.log(`✅ Removed Ultra role from ${targetMember.user.tag}`);
            }

            // Update ticket status
            ticket.status = 'approved';
            ticket.approvedBy = interaction.user.id;
            ticket.approvedAt = Date.now();

            // Update the embed
            const originalChannel = guild.channels.cache.get(ticket.channelId);
            if (originalChannel) {
                const originalMessage = await originalChannel.messages.fetch(ticket.messageId).catch(() => null);
                if (originalMessage) {
                    const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
                        .setColor('#00FF00')
                        .addFields(
                            { name: '✅ Status', value: `Aprovado por <@${interaction.user.id}>`, inline: false },
                            { name: '⏰ Aprovado em', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
                        );

                    await originalMessage.edit({ embeds: [updatedEmbed], components: [] });
                }
            }

            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('✅ Solicitação Aprovada!')
                    .setDescription(
                        `Parabéns! Sua solicitação para o departamento **${ticket.requestedDepartment}** foi aprovada!\n\n` +
                        `🎉 Você recebeu o cargo: **${ticket.requestedRole}**\n\n` +
                        `Agora você tem acesso aos canais da sua equipe. Bem-vindo(a) ao time!`
                    )
                    .setTimestamp();

                await targetMember.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`⚠️ Could not DM user ${targetMember.user.tag}: ${error.message}`);
            }

            // Send welcome message in chat-geral
            const chatGeral = guild.channels.cache.find(c => c.name === '💬-chat-geral');
            if (chatGeral) {
                const welcomeEmbed = new EmbedBuilder()
                    .setColor('#00D9FF')
                    .setTitle('🎉 Novo Membro no Time!')
                    .setDescription(
                        `**${targetMember.user.tag}** acabou de se juntar ao departamento **${ticket.requestedDepartment}**!\n\n` +
                        `Bem-vindo(a), ${targetMember}! 🚀`
                    )
                    .setThumbnail(targetMember.user.displayAvatarURL())
                    .setTimestamp();

                await chatGeral.send({ embeds: [welcomeEmbed] });
            }

            await interaction.editReply(
                `✅ **Solicitação aprovada com sucesso!**\n\n` +
                `${targetMember} recebeu o cargo **${ticket.requestedRole}** e agora tem acesso aos canais da equipe.`
            );

            logSecurityEvent('ONBOARDING_APPROVED', ticket.userId, `By: ${interaction.user.tag}, Department: ${ticket.requestedDepartment}`);
            console.log(`✅ Onboarding approved: ${ticket.userId} → ${ticket.requestedDepartment} by ${interaction.user.tag}`);

        } else if (action === 'reject') {
            // Reject - notify user
            ticket.status = 'rejected';
            ticket.rejectedBy = interaction.user.id;
            ticket.rejectedAt = Date.now();

            // Update the embed
            const originalChannel = guild.channels.cache.get(ticket.channelId);
            if (originalChannel) {
                const originalMessage = await originalChannel.messages.fetch(ticket.messageId).catch(() => null);
                if (originalMessage) {
                    const updatedEmbed = EmbedBuilder.from(originalMessage.embeds[0])
                        .setColor('#FF0000')
                        .addFields(
                            { name: '❌ Status', value: `Rejeitado por <@${interaction.user.id}>`, inline: false },
                            { name: '⏰ Rejeitado em', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: false }
                        );

                    await originalMessage.edit({ embeds: [updatedEmbed], components: [] });
                }
            }

            // Send DM to user
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Solicitação Rejeitada')
                    .setDescription(
                        `Sua solicitação para o departamento **${ticket.requestedDepartment}** foi rejeitada.\n\n` +
                        `Você pode se candidatar a um departamento diferente no canal <#${guild.channels.cache.find(c => c.name === '🎯-escolher-departamento')?.id}>.`
                    )
                    .setTimestamp();

                await targetMember.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`⚠️ Could not DM user ${targetMember.user.tag}: ${error.message}`);
            }

            await interaction.editReply(
                `❌ **Solicitação rejeitada.**\n\n` +
                `${targetMember} foi notificado e pode se candidatar a outro departamento.`
            );

            logSecurityEvent('ONBOARDING_REJECTED', ticket.userId, `By: ${interaction.user.tag}, Department: ${ticket.requestedDepartment}`);
            console.log(`❌ Onboarding rejected: ${ticket.userId} → ${ticket.requestedDepartment} by ${interaction.user.tag}`);
        }

    } catch (error) {
        console.error('❌ Error in handleOnboardingApproval:', error);
        await interaction.editReply('❌ Ocorreu um erro ao processar a aprovação. Por favor, tente novamente.').catch(() => {});
        logSecurityEvent('ONBOARDING_APPROVAL_ERROR', interaction.user.id, `Error: ${error.message}`);
    }
}

async function setupVerificationSystem(guild) {
    const verificationChannel = guild.channels.cache.find(c => c.name === '✅-verificar');

    if (!verificationChannel) {
        console.log('❌ Verification channel not found. Run setup first!');
        return;
    }

    // Clear old messages
    const messages = await verificationChannel.messages.fetch({ limit: 10 });
    await verificationChannel.bulkDelete(messages).catch(() => {});

    // Create verification embed
    const verificationEmbed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle('🔐 Bem-vindo ao Ultra Creators!')
        .setDescription(
            '**Olá! Seja bem-vindo(a) ao servidor oficial da UltraCreators!** 👋\n\n' +
            'Para ter acesso aos canais e interagir com a comunidade, você precisa aceitar nossos termos e regras.\n\n' +
            '**📋 Regras da Comunidade:**\n' +
            '1️⃣ **Respeito** - Trate todos com respeito e cordialidade\n' +
            '2️⃣ **Sem spam** - Não faça spam ou flood nos canais\n' +
            '3️⃣ **Conteúdo apropriado** - Mantenha o conteúdo apropriado e profissional\n' +
            '4️⃣ **Sem autopromoção** - Não faça propaganda sem autorização\n' +
            '5️⃣ **Siga as regras do Discord** - Respeite os Termos de Serviço do Discord\n' +
            '6️⃣ **Confidencialidade** - Não compartilhe informações confidenciais da empresa\n\n' +
            '**📜 Termos de Comportamento:**\n' +
            '• Você se compromete a manter um ambiente profissional e colaborativo\n' +
            '• Você entende que violações podem resultar em advertências ou ban\n' +
            '• Você concorda em seguir as diretrizes da empresa e do Discord\n\n' +
            '**✅ Para aceitar os termos e ter acesso ao servidor:**\n' +
            'Clique no botão abaixo "Aceitar Termos" para receber a tag **Ultra** e ter acesso aos canais!'
        )
        .setFooter({ text: 'UltraCreators • Sistema de Verificação' })
        .setTimestamp();

    // Create accept button
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('verify_accept')
                .setLabel('✅ Aceitar Termos')
                .setStyle(ButtonStyle.Success)
                .setEmoji('✅')
        );

    await verificationChannel.send({ embeds: [verificationEmbed], components: [row] });

    console.log('✅ Verification system created!');
}

async function setupOnboardingSystem(guild) {
    const onboardingChannel = guild.channels.cache.find(c => c.name === '🎯-escolher-departamento');

    if (!onboardingChannel) {
        console.log('❌ Onboarding channel not found. Run setup first!');
        return;
    }

    // Clear old messages
    const messages = await onboardingChannel.messages.fetch({ limit: 10 });
    await onboardingChannel.bulkDelete(messages).catch(() => {});

    // Create onboarding embed
    const onboardingEmbed = new EmbedBuilder()
        .setColor('#00D9FF')
        .setTitle('🎯 Escolha seu Departamento')
        .setDescription(
            '**Bem-vindo à UltraCreators!** 🚀\n\n' +
            'Para começar a trabalhar conosco, você precisa escolher o departamento onde deseja atuar.\n\n' +
            '**📋 Departamentos Disponíveis:**\n\n' +
            '💰 **Commercial Ops** - Equipe de vendas e prospecção de afiliados\n' +
            '⚙️ **Coordination Ops** - Coordenação e gestão de demandas operacionais\n' +
            '📱 **Social Media** - Criação de conteúdo e gestão de redes sociais\n' +
            '🎤 **Recruitment Ops** - Recrutamento e gestão de influencers\n' +
            '🎬 **Criador de Conteúdo** - Criador de conteúdo contratado pela empresa\n\n' +
            '⚠️ **Importante:**\n' +
            '• Após selecionar, sua solicitação será enviada ao líder da equipe\n' +
            '• Você receberá uma notificação quando for aprovado\n' +
            '• Escolha com cuidado - você só pode se candidatar a um departamento\n\n' +
            '👇 **Clique no botão abaixo para fazer sua escolha:**'
        )
        .setFooter({ text: 'UltraCreators • Sistema de Onboarding' })
        .setTimestamp();

    // Create department selection buttons (2 rows)
    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('onboard_commercial')
                .setLabel('Commercial Ops')
                .setEmoji('💰')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('onboard_coordination')
                .setLabel('Coordination Ops')
                .setEmoji('⚙️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('onboard_socialmedia')
                .setLabel('Social Media')
                .setEmoji('📱')
                .setStyle(ButtonStyle.Primary)
        );

    const row2 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('onboard_recruitment')
                .setLabel('Recruitment Ops')
                .setEmoji('🎤')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('onboard_creator')
                .setLabel('Criador de Conteúdo')
                .setEmoji('🎬')
                .setStyle(ButtonStyle.Success)
        );

    await onboardingChannel.send({ embeds: [onboardingEmbed], components: [row1, row2] });

    console.log('✅ Onboarding system created!');
}

// ============================================================================
// NEW FEATURE INTERACTION HANDLERS
// ============================================================================

// Handle SLA pause/resume
async function handleSLAControl(interaction, action, ticketId) {
    await interaction.deferReply({ ephemeral: true });

    const ticket = activeTickets.get(ticketId);
    if (!ticket) {
        await interaction.editReply('❌ Ticket não encontrado!');
        return;
    }

    if (action === 'pause') {
        const success = pauseSLA(ticketId);
        if (success) {
            await interaction.editReply(
                `⏸️ **SLA Pausado**\n\n` +
                `O SLA foi pausado para o ticket \`${ticketId}\`.\n` +
                `O prazo será estendido quando o SLA for retomado.\n\n` +
                `**Motivo comum:** Aguardando resposta do usuário.`
            );

            // Update ticket message to reflect paused state
            await refreshTicketMessage(interaction.guild, ticketId);
        } else {
            await interaction.editReply('❌ Não foi possível pausar o SLA. Ele pode já estar pausado.');
        }
    } else if (action === 'resume') {
        const success = resumeSLA(ticketId);
        if (success) {
            await interaction.editReply(
                `▶️ **SLA Retomado**\n\n` +
                `O SLA foi retomado para o ticket \`${ticketId}\`.\n` +
                `O prazo foi ajustado para compensar o tempo pausado.`
            );

            // Update ticket message to reflect resumed state
            await refreshTicketMessage(interaction.guild, ticketId);
        } else {
            await interaction.editReply('❌ Não foi possível retomar o SLA. Ele pode não estar pausado.');
        }
    }
}

// Handle tag management
async function handleTagManagement(interaction, action, ticketId) {
    const ticket = activeTickets.get(ticketId);
    if (!ticket) {
        await interaction.reply({ content: '❌ Ticket não encontrado!', ephemeral: true });
        return;
    }

    if (action === 'add') {
        // Create select menu with available tags
        const tagOptions = [];
        Object.entries(TICKET_TAGS).forEach(([key, tag]) => {
            const hasTag = ticket.tags && ticket.tags.includes(key);
            tagOptions.push(
                new StringSelectMenuOptionBuilder()
                    .setLabel(tag.label)
                    .setValue(key)
                    .setEmoji(tag.emoji)
                    .setDescription(hasTag ? '✅ Já adicionada' : 'Adicionar esta tag')
            );
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tag_select_${ticketId}`)
            .setPlaceholder('Selecione uma tag para adicionar')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(tagOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🏷️ Gerenciar Tags')
            .setDescription(
                `**Ticket:** ${ticket.title}\n` +
                `**ID:** \`${ticketId}\`\n\n` +
                `**Tags Atuais:** ${getTagsString(ticket)}\n\n` +
                `Selecione uma tag no menu abaixo para adicionar:`
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    } else if (action === 'remove') {
        // Show current tags for removal
        if (!ticket.tags || ticket.tags.length === 0) {
            await interaction.reply({
                content: '❌ Este ticket não possui tags para remover!',
                ephemeral: true
            });
            return;
        }

        const tagOptions = ticket.tags.map(tagKey => {
            const tag = TICKET_TAGS[tagKey];
            return new StringSelectMenuOptionBuilder()
                .setLabel(tag.label)
                .setValue(tagKey)
                .setEmoji(tag.emoji)
                .setDescription('Remover esta tag');
        });

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId(`tag_remove_select_${ticketId}`)
            .setPlaceholder('Selecione uma tag para remover')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(tagOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🏷️ Remover Tags')
            .setDescription(
                `**Ticket:** ${ticket.title}\n` +
                `**ID:** \`${ticketId}\`\n\n` +
                `**Tags Atuais:** ${getTagsString(ticket)}\n\n` +
                `Selecione uma tag no menu abaixo para remover:`
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    }
}

// Handle merge duplicate check
async function handleMergeCheck(interaction, ticketId) {
    await interaction.deferReply({ ephemeral: true });

    const ticket = activeTickets.get(ticketId);
    if (!ticket) {
        await interaction.editReply('❌ Ticket não encontrado!');
        return;
    }

    // Find potential duplicates
    const duplicates = findDuplicateTickets(ticket.title, ticket.team);

    // Remove the current ticket from duplicates list
    const otherDuplicates = duplicates.filter(id => id !== ticketId);

    if (otherDuplicates.length === 0) {
        await interaction.editReply(
            `✅ **Nenhum Ticket Duplicado Encontrado**\n\n` +
            `Não foram encontrados tickets similares para \`${ticketId}\`.`
        );
        return;
    }

    // Show potential duplicates
    let message = `🔄 **Tickets Similares Encontrados**\n\n`;
    message += `Foram encontrados ${otherDuplicates.length} ticket(s) similar(es):\n\n`;

    for (const dupId of otherDuplicates.slice(0, 5)) { // Show max 5
        const dupTicket = activeTickets.get(dupId);
        if (dupTicket) {
            message += `📋 **ID:** \`${dupId}\`\n`;
            message += `   **Título:** ${dupTicket.title}\n`;
            message += `   **Status:** ${dupTicket.status}\n`;
            message += `   **Criado:** <t:${Math.floor(dupTicket.createdAt / 1000)}:R>\n\n`;
        }
    }

    message += `\n**Ação Sugerida:**\n`;
    message += `Se estes tickets são duplicados, um Lead/Manager pode mesclá-los.\n`;
    message += `Use: \`/merge ${ticketId} <duplicate-id>\``;

    await interaction.editReply(message);
}

// Helper function to refresh ticket message with updated data
async function refreshTicketMessage(guild, ticketId) {
    const ticket = activeTickets.get(ticketId);
    if (!ticket) return;

    try {
        const channel = guild.channels.cache.get(ticket.channelId);
        if (!channel) return;

        const message = await channel.messages.fetch(ticket.messageId);
        if (!message) return;

        const teamConfig = TEAMS[ticket.team];
        const slaConfig = SLA_CONFIG[ticket.priorityKey];
        const now = Date.now();
        const slaTimestamp = Math.floor(ticket.slaDeadline / 1000);

        // Use dynamic color based on SLA status
        const embedColor = getSLAColor(ticket);

        // Create updated embed
        const updatedEmbed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle(`${TICKET_TYPES[ticket.type].emoji} ${ticket.title}`)
            .setDescription(ticket.description)
            .addFields(
                { name: '👤 Criado por', value: `<@${ticket.creator}>`, inline: true },
                { name: '🏷️ Equipe', value: `${teamConfig.emoji} ${teamConfig.name}`, inline: true },
                { name: '📊 Status', value: ticket.status === 'open' ? '🟡 Aberto' : ticket.status === 'progress' ? '⏳ Em Andamento' : '✅ Resolvido', inline: true },
                { name: '⚡ Prioridade', value: `${slaConfig.emoji} ${slaConfig.label} (SLA: ${slaConfig.hours}h)`, inline: true },
                { name: '🏷️ Tipo', value: `${TICKET_TYPES[ticket.type].emoji} ${TICKET_TYPES[ticket.type].name}`, inline: true },
                { name: '🆔 ID', value: `\`${ticketId}\``, inline: true },
                { name: '🏷️ Tags', value: getTagsString(ticket), inline: true },
                { name: '⏸️ SLA Status', value: ticket.slaPaused ? '⏸️ Pausado' : '▶️ Ativo', inline: true },
                { name: '📅 Criado em', value: `<t:${Math.floor(ticket.createdAt / 1000)}:f>`, inline: true },
                { name: '⏰ SLA Deadline', value: `<t:${slaTimestamp}:R> (<t:${slaTimestamp}:f>)`, inline: false }
            )
            .setFooter({ text: 'Use os botões abaixo para gerenciar o ticket' })
            .setTimestamp();

        if (ticket.assignee) {
            updatedEmbed.addFields({ name: '👨‍💼 Responsável', value: `<@${ticket.assignee}>`, inline: true });
        }

        // Update button rows
        const buttonRows = createTicketButtons(ticketId, ticket.status, ticket);

        await message.edit({ embeds: [updatedEmbed], components: buttonRows });
    } catch (error) {
        console.error(`❌ Error refreshing ticket message for ${ticketId}:`, error.message);
    }
}

// Auto-close monitoring for resolved tickets
async function checkAutoClose(guild) {
    if (!AUTO_CLOSE_CONFIG.enabled) return;

    const now = Date.now();
    const warningThreshold = AUTO_CLOSE_CONFIG.warningHours * 60 * 60 * 1000;
    const closeThreshold = AUTO_CLOSE_CONFIG.closeHours * 60 * 60 * 1000;

    for (const [ticketId, ticket] of activeTickets.entries()) {
        // Only check resolved tickets
        if (ticket.status !== 'resolved') continue;

        // Get or create tracking entry
        let tracking = resolvedTickets.get(ticketId);
        if (!tracking) {
            tracking = {
                resolvedAt: now,
                warnedAt: null,
                closedAt: null
            };
            resolvedTickets.set(ticketId, tracking);
            continue;
        }

        const timeSinceResolved = now - tracking.resolvedAt;
        const thread = guild.channels.cache.get(ticket.threadId);
        if (!thread) continue;

        // Send 24h warning if not warned yet
        if (!tracking.warnedAt && timeSinceResolved >= warningThreshold) {
            console.log(`⏰ Sending auto-close warning for ticket ${ticketId}`);

            const warningEmbed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle('⏰ Aviso de Fechamento Automático')
                .setDescription(
                    `Este ticket está resolvido há **${AUTO_CLOSE_CONFIG.warningHours} horas** sem atividade.\n\n` +
                    `📋 **Ticket:** ${ticket.title}\n\n` +
                    `Se não houver resposta nas próximas **${AUTO_CLOSE_CONFIG.closeHours - AUTO_CLOSE_CONFIG.warningHours} horas**, ` +
                    `este ticket será **fechado automaticamente**.\n\n` +
                    `💬 **Para manter o ticket aberto:** Envie qualquer mensagem neste canal ou clique em "Reabrir Ticket".`
                )
                .setTimestamp();

            await thread.send({ embeds: [warningEmbed] });
            tracking.warnedAt = now;
            resolvedTickets.set(ticketId, tracking);
        }

        // Close after 48h total
        if (tracking.warnedAt && timeSinceResolved >= closeThreshold && !tracking.closedAt) {
            console.log(`🔒 Auto-closing ticket ${ticketId} after ${AUTO_CLOSE_CONFIG.closeHours}h of inactivity`);

            try {
                // Archive the thread
                await thread.setArchived(true);
                await thread.setLocked(true);

                // Move to archive category if it exists
                const teamConfig = TEAMS[ticket.team];
                const archiveCategory = guild.channels.cache.find(
                    c => c.name === '📦 ARQUIVO DE TICKETS' && c.type === ChannelType.GuildCategory
                );

                if (archiveCategory && thread.parent) {
                    await thread.setParent(archiveCategory.id);
                    console.log(`   📦 Moved ${thread.name} to archive`);
                }

                // Send final closure message
                const closureEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('🔒 Ticket Fechado Automaticamente')
                    .setDescription(
                        `Este ticket foi fechado automaticamente após **${AUTO_CLOSE_CONFIG.closeHours} horas** de inatividade.\n\n` +
                        `📋 **Ticket:** ${ticket.title}\n` +
                        `⏱️ **Resolvido em:** <t:${Math.floor(tracking.resolvedAt / 1000)}:f>\n\n` +
                        `Se você precisar reabrir este ticket, entre em contato com a equipe ${teamConfig.emoji} **${teamConfig.name}**.`
                    )
                    .setTimestamp();

                await thread.send({ embeds: [closureEmbed] });

                // Mark as closed and remove from active tickets
                tracking.closedAt = now;
                resolvedTickets.set(ticketId, tracking);
                activeTickets.delete(ticketId);

                console.log(`   ✅ Ticket ${ticketId} auto-closed successfully`);
            } catch (error) {
                console.error(`   ❌ Error auto-closing ticket ${ticketId}:`, error.message);
            }
        }
    }
}

async function checkSLABreaches(guild) {
    const now = Date.now();

    for (const [ticketId, ticket] of activeTickets.entries()) {
        // Only check tickets that are open or in progress
        if (ticket.status === 'resolved') continue;

        // Skip if SLA is paused (waiting on user)
        if (ticket.slaPaused) continue;

        // Skip if already breached and notified
        if (ticket.slaBreached) continue;

        // Check if SLA deadline has passed
        if (now >= ticket.slaDeadline) {
            console.log(`⚠️ SLA breach detected for ticket ${ticketId}`);

            const teamConfig = TEAMS[ticket.team];
            const slaConfig = SLA_CONFIG[ticket.priorityKey];
            const thread = guild.channels.cache.get(ticket.threadId);

            if (!thread) continue;

            // Mark as breached and add escalated tag
            ticket.slaBreached = true;
            addTagToTicket(ticketId, 'escalated');

            // Get team lead role
            let teamLeadRole;
            switch (ticket.team) {
                case 'dev':
                    teamLeadRole = guild.roles.cache.find(r => r.name === '⚡ Dev Master');
                    break;
                case 'comercial':
                    teamLeadRole = guild.roles.cache.find(r => r.name === '🟠 Commercial Lead');
                    break;
                case 'coordenacao':
                    teamLeadRole = guild.roles.cache.find(r => r.name === '🟠 Coordination Lead');
                    break;
                case 'recrutamento':
                    teamLeadRole = guild.roles.cache.find(r => r.name === '🟠 Recruitment Lead');
                    break;
            }

            // Determine who to ping based on escalation config
            let pingMessage = '';
            let rolesToPing = [teamLeadRole];

            if (slaConfig.escalate && slaConfig.escalateRoles) {
                // P0/P1 with escalation enabled: ping managers
                pingMessage = `🚨 **ALERTA DE SLA CRÍTICO!**\n\n`;

                // Add escalation roles
                slaConfig.escalateRoles.forEach(roleName => {
                    const role = guild.roles.cache.find(r => r.name === roleName);
                    if (role && !rolesToPing.includes(role)) {
                        rolesToPing.push(role);
                    }
                });

                pingMessage += rolesToPing.join(' ') + '\n\n';
            } else {
                // P2/P3: ping only team lead
                pingMessage = `⚠️ **ALERTA DE SLA!**\n\n${teamLeadRole}\n\n`;
            }

            pingMessage +=
                `**Ticket:** ${ticket.title}\n` +
                `**Prioridade:** ${slaConfig.emoji} ${slaConfig.label} (SLA: ${slaConfig.hours}h)\n` +
                `**Equipe:** ${teamConfig.emoji} ${teamConfig.name}\n` +
                `**Criado há:** <t:${Math.floor(ticket.createdAt / 1000)}:R>\n` +
                `**Status:** ${ticket.status === 'open' ? '🟡 Aberto' : '⏳ Em Andamento'}\n\n` +
                `**O SLA de ${slaConfig.hours}h foi atingido!** Este ticket precisa de atenção imediata.`;

            // Send alert in thread
            await thread.send(pingMessage);

            // Also send to team dashboard
            const category = guild.channels.cache.find(c => c.name === teamConfig.category && c.type === ChannelType.GuildCategory);
            if (category) {
                const dashboardChannel = guild.channels.cache.find(
                    c => c.name === teamConfig.dashboardChannel && c.parentId === category.id
                );

                if (dashboardChannel) {
                    await dashboardChannel.send(
                        `🚨 **SLA BREACH** - Ticket \`${ticketId}\`\n` +
                        pingMessage +
                        `\n📋 Thread: <#${thread.id}>`
                    );
                }
            }

            // Refresh ticket message to show escalated tag and updated color
            await refreshTicketMessage(guild, ticketId);
        }
    }
}

client.login(process.env.DISCORD_TOKEN);
