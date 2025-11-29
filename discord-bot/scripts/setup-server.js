const { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
    ]
});

// Server structure configuration
const serverConfig = {
    roles: [
        { name: '⚡ Dev Master', color: '#000000', permissions: ['Administrator'], hoist: true },
        { name: '🔴 CEO', color: '#E74C3C', permissions: ['ManageGuild', 'ManageRoles', 'ManageChannels'], hoist: true },
        { name: '🟠 Commercial Lead', color: '#E67E22', permissions: ['ManageMessages', 'MentionEveryone'], hoist: true },
        { name: '🟠 Coordination Lead', color: '#F39C12', permissions: ['ManageMessages', 'MentionEveryone'], hoist: true },
        { name: '🟠 Recruitment Lead', color: '#FF9800', permissions: ['ManageMessages', 'MentionEveryone', 'ManageRoles'], hoist: true },
        { name: '💻 DevOps', color: '#2ECC71', permissions: [], hoist: true },
        { name: '🟡 Commercial Ops', color: '#3498DB', permissions: [], hoist: true },
        { name: '🟡 Coordination Ops', color: '#9B59B6', permissions: [], hoist: true },
        { name: '🟡 Social Media', color: '#E91E63', permissions: [], hoist: true },
        { name: '🟡 Recruitment Ops', color: '#00BCD4', permissions: [], hoist: true },
        { name: '🎬 Criador de Conteúdo', color: '#9C27B0', permissions: [], hoist: true },
        { name: '✅ Ultra', color: '#00D9FF', permissions: [], hoist: false }, // Base verification role
    ],

    categories: [
        {
            name: '🔐 VERIFICAÇÃO',
            position: 0,
            channels: [
                { name: '✅-verificar', type: ChannelType.GuildText, permissions: 'verification-only' },
            ]
        },
        {
            name: '🎯 ONBOARDING',
            position: 1,
            channels: [
                { name: '🎯-escolher-departamento', type: ChannelType.GuildText, permissions: 'onboarding-selection' },
            ]
        },
        {
            name: '📌 GERAL',
            position: 2,
            channels: [
                { name: '📋-regras', type: ChannelType.GuildText, permissions: 'verified-readonly' },
                { name: '📢-avisos', type: ChannelType.GuildText, permissions: 'verified-leadership-post' },
                { name: '💬-chat-geral', type: ChannelType.GuildText, permissions: 'verified-all' },
            ]
        },
        {
            name: '💼 DIRETORIA',
            position: 3,
            channels: [
                { name: '🏢-diretoria-geral', type: ChannelType.GuildText, permissions: 'leadership-only' },
                { name: '📊-estrategia', type: ChannelType.GuildText, permissions: 'leadership-only' },
                { name: '🎯-metas-kpis', type: ChannelType.GuildText, permissions: 'leadership-only' },
                { name: '🔊-reuniao-diretoria', type: ChannelType.GuildVoice, permissions: 'leadership-only' },
            ]
        },
        {
            name: '💰 COMERCIAL',
            position: 4,
            channels: [
                { name: '📈-estrategia', type: ChannelType.GuildText, permissions: 'commercial' },
                { name: '🎯-prospeccao', type: ChannelType.GuildText, permissions: 'commercial' },
                { name: '💼-leads-pipeline', type: ChannelType.GuildText, permissions: 'commercial' },
                { name: '📊-relatorios', type: ChannelType.GuildText, permissions: 'commercial-reports' },
                { name: '📞-calls-comercial', type: ChannelType.GuildVoice, permissions: 'commercial' },
                // Onboarding
                { name: '📋-onboarding-requests', type: ChannelType.GuildText, permissions: 'onboarding-comercial' },
                // Ticket channels
                { name: '🎫-criar-ticket-comercial', type: ChannelType.GuildText, permissions: 'ticket-create-all-teams' },
                { name: '📋-tickets-dashboard', type: ChannelType.GuildText, permissions: 'support-comercial-dashboard' },
                { name: '🟡-tickets-abertos', type: ChannelType.GuildText, permissions: 'tickets-open-view-all' },
                { name: '⏳-tickets-andamento', type: ChannelType.GuildText, permissions: 'support-comercial' },
                { name: '✅-tickets-resolvidos', type: ChannelType.GuildText, permissions: 'support-comercial' },
            ]
        },
        {
            name: '⚙️ COORDENAÇÃO',
            position: 5,
            channels: [
                { name: '🗂️-coordenacao-geral', type: ChannelType.GuildText, permissions: 'coordination' },
                { name: '📋-demandas', type: ChannelType.GuildText, permissions: 'coordination' },
                { name: '⏰-prazos-entregas', type: ChannelType.GuildText, permissions: 'coordination' },
                { name: '📱-social-media', type: ChannelType.GuildText, permissions: 'social-media' },
                { name: '🎨-conteudo-agencia', type: ChannelType.GuildText, permissions: 'social-media' },
                { name: '🔊-coordenacao-team', type: ChannelType.GuildVoice, permissions: 'coordination' },
                // Onboarding
                { name: '📋-onboarding-requests', type: ChannelType.GuildText, permissions: 'onboarding-coordenacao' },
                // Ticket channels
                { name: '🎫-criar-ticket-coordenacao', type: ChannelType.GuildText, permissions: 'ticket-create-all-teams' },
                { name: '📋-tickets-dashboard', type: ChannelType.GuildText, permissions: 'support-coordenacao-dashboard' },
                { name: '🟡-tickets-abertos', type: ChannelType.GuildText, permissions: 'tickets-open-view-all' },
                { name: '⏳-tickets-andamento', type: ChannelType.GuildText, permissions: 'support-coordenacao' },
                { name: '✅-tickets-resolvidos', type: ChannelType.GuildText, permissions: 'support-coordenacao' },
            ]
        },
        {
            name: '🎤 RECRUTAMENTO',
            position: 6,
            channels: [
                { name: '🎯-estrategia-talent', type: ChannelType.GuildText, permissions: 'recruitment' },
                { name: '🔍-prospeccao', type: ChannelType.GuildText, permissions: 'recruitment' },
                { name: '⭐-banco-talentos', type: ChannelType.GuildText, permissions: 'recruitment' },
                { name: '📊-relatorios', type: ChannelType.GuildText, permissions: 'recruitment-reports' },
                { name: '🔊-recrutamento-team', type: ChannelType.GuildVoice, permissions: 'recruitment' },
                // Onboarding
                { name: '📋-onboarding-requests', type: ChannelType.GuildText, permissions: 'onboarding-recrutamento' },
                // Ticket channels
                { name: '🎫-criar-ticket-recrutamento', type: ChannelType.GuildText, permissions: 'ticket-create-all-teams' },
                { name: '📋-tickets-dashboard', type: ChannelType.GuildText, permissions: 'support-recrutamento-dashboard' },
                { name: '🟡-tickets-abertos', type: ChannelType.GuildText, permissions: 'tickets-open-view-all' },
                { name: '⏳-tickets-andamento', type: ChannelType.GuildText, permissions: 'support-recrutamento' },
                { name: '✅-tickets-resolvidos', type: ChannelType.GuildText, permissions: 'support-recrutamento' },
            ]
        },
        {
            name: '📅 REUNIÕES',
            position: 7,
            channels: [
                { name: '📆-agenda-semanal', type: ChannelType.GuildText, permissions: 'verified-view' },
                { name: '📝-atas-reunioes', type: ChannelType.GuildText, permissions: 'verified-leadership-post' },
                { name: '🔊-reuniao-geral', type: ChannelType.GuildVoice, permissions: 'verified-all' },
                { name: '🔊-sala-1', type: ChannelType.GuildVoice, permissions: 'verified-all' },
                { name: '🔊-sala-2', type: ChannelType.GuildVoice, permissions: 'verified-all' },
            ]
        },
        {
            name: '🎬 CRIADORES DE CONTEÚDO',
            position: 8,
            channels: [
                { name: '📢-avisos-creators', type: ChannelType.GuildText, permissions: 'creators-announcements' },
                { name: '💬-chat-creators', type: ChannelType.GuildText, permissions: 'creators' },
                { name: '📊-performance', type: ChannelType.GuildText, permissions: 'creators-reports' },
                { name: '📝-briefings', type: ChannelType.GuildText, permissions: 'creators' },
                { name: '🎥-conteudos', type: ChannelType.GuildText, permissions: 'creators' },
                { name: '🔊-creators-room', type: ChannelType.GuildVoice, permissions: 'creators' },
            ]
        },
        {
            name: '💻 DEV-OPS',
            position: 9,
            channels: [
                { name: '⚙️-dev-geral', type: ChannelType.GuildText, permissions: 'devops' },
                { name: '🔧-infraestrutura', type: ChannelType.GuildText, permissions: 'devops' },
                { name: '📊-logs-sistemas', type: ChannelType.GuildText, permissions: 'devops' },
                { name: '🔊-dev-room', type: ChannelType.GuildVoice, permissions: 'devops' },
                // Onboarding
                { name: '📋-onboarding-requests', type: ChannelType.GuildText, permissions: 'onboarding-devops' },
                // Ticket channels
                { name: '🎫-criar-ticket-dev', type: ChannelType.GuildText, permissions: 'ticket-create-all-teams' },
                { name: '📋-tickets-dashboard', type: ChannelType.GuildText, permissions: 'support-dev-dashboard' },
                { name: '🟡-tickets-abertos', type: ChannelType.GuildText, permissions: 'tickets-open-view-all' },
                { name: '⏳-tickets-andamento', type: ChannelType.GuildText, permissions: 'support-dev' },
                { name: '✅-tickets-resolvidos', type: ChannelType.GuildText, permissions: 'support-dev' },
            ]
        },
        {
            name: '📊 ANALYTICS',
            position: 10,
            channels: [
                { name: '📊-dashboard-geral', type: ChannelType.GuildText, permissions: 'analytics-dashboard' },
            ]
        },
        {
            name: '📦 ARQUIVO DE TICKETS',
            position: 11,
            channels: []  // Work channels will be moved here dynamically
        },
    ]
};

// Permission configurations
function getChannelPermissions(guild, permType, roles) {
    const everyoneRole = guild.roles.everyone;
    const devMaster = roles['⚡ Dev Master'];
    const ceo = roles['🔴 CEO'];
    const commercialLead = roles['🟠 Commercial Lead'];
    const coordinationLead = roles['🟠 Coordination Lead'];
    const recruitmentLead = roles['🟠 Recruitment Lead'];
    const devOps = roles['💻 DevOps'];
    const commercialOps = roles['🟡 Commercial Ops'];
    const coordinationOps = roles['🟡 Coordination Ops'];
    const socialMedia = roles['🟡 Social Media'];
    const recruitmentOps = roles['🟡 Recruitment Ops'];
    const contentCreator = roles['🎬 Criador de Conteúdo'];
    const ultraRole = roles['✅ Ultra'];

    const basePermissions = [
        {
            id: everyoneRole.id,
            deny: [PermissionFlagsBits.ViewChannel],
        },
        {
            id: devMaster.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        },
    ];

    switch (permType) {
        case 'verification-only':
            // Only unverified users (no Ultra role) can see
            return [
                {
                    id: everyoneRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: ultraRole.id,
                    deny: [PermissionFlagsBits.ViewChannel], // Hide from verified users
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'onboarding-selection':
            // Only Ultra users WITHOUT any Ops/Creator role can see
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ultraRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                // Hide from users who already have Ops/Creator roles
                {
                    id: commercialOps.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: coordinationOps.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: socialMedia.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: recruitmentOps.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: contentCreator.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'verified-readonly':
            // Only verified users (with Ultra role) can see, read-only
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ultraRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'verified-leadership-post':
            // Verified users can see, only leaders can post
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ultraRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'verified-all':
            // Verified users can see and post
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ultraRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'public-readonly':
        case 'public-readonly':
            return [
                {
                    id: everyoneRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'leadership-post':
            return [
                {
                    id: everyoneRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'all':
            return [
                {
                    id: everyoneRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'all-view':
            return [
                {
                    id: everyoneRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                ...basePermissions.slice(1),
            ];

        case 'leadership-only':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'commercial':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'commercial-reports':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ];

        case 'coordination':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: coordinationOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'social-media':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'recruitment':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'recruitment-reports':
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ];

        case 'creators-announcements':
            // Recruitment team posts, creators and CEO read
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: contentCreator.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ];

        case 'creators':
            // Recruitment team and creators can interact
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: contentCreator.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'creators-reports':
            // Recruitment team posts performance reports, creators read
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: contentCreator.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ];

        case 'devops':
            // Dev Master and DevOps members only
            return [
                ...basePermissions,
                {
                    id: devOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-all-teams':
            // All team members can see and create tickets (Leads + Ops)
            return [
                ...basePermissions,
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: devOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-master-dashboard':
            // CEO + Dev Master only
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-dev-dashboard':
            // Dev Master + DevOps only
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: devOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-dev':
            // Dev Master + DevOps can see and manage
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: devOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-comercial-dashboard':
            // CEO + Commercial Lead + Commercial Ops
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-comercial':
            // CEO + Commercial team can see and work on tickets
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-coordenacao-dashboard':
            // CEO + Coordination Lead + Coordination Ops + Social Media
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: coordinationOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-coordenacao':
            // CEO + Coordination team can see and work on tickets
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: coordinationOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-recrutamento-dashboard':
            // CEO + Recruitment Lead + Recruitment Ops
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-recrutamento':
            // CEO + Recruitment team can see and work on tickets
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'verified-view':
            // Verified users can view only (no posting)
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ultraRole.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'onboarding-comercial':
            // Commercial Lead + CEO + Dev Master can see onboarding requests
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'onboarding-coordenacao':
            // Coordination Lead + CEO + Dev Master can see onboarding requests
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'onboarding-recrutamento':
            // Recruitment Lead + CEO + Dev Master can see onboarding requests
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'onboarding-devops':
            // Dev Master only for DevOps onboarding
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'analytics-dashboard':
            // CEO + Dev Master only
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ];

        case 'support-dev-create':
            // All verified users can create dev tickets (report bugs)
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: ultraRole.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
            ];

        case 'ticket-create-all-teams':
            // All team members (Leads + Ops + CEO + Dev Master) can create tickets for any team
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                // All Leads
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                // All Ops roles
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                {
                    id: devOps.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
                // Content creators can also report issues/needs
                {
                    id: contentCreator.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
                },
            ];

        case 'tickets-open-view-all':
            // All Ops/Lead/CEO/Dev Master can VIEW all open tickets (read-only) across all teams
            return [
                {
                    id: everyoneRole.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                },
                {
                    id: devMaster.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
                },
                {
                    id: ceo.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                // All Leads (view-only)
                {
                    id: commercialLead.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationLead.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentLead.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                // All Ops roles (view-only)
                {
                    id: commercialOps.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: coordinationOps.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: socialMedia.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: recruitmentOps.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
                {
                    id: devOps.id,
                    allow: [PermissionFlagsBits.ViewChannel],
                    deny: [PermissionFlagsBits.SendMessages],
                },
            ];

        default:
            return basePermissions;
    }
}

async function setupServer(guildId) {
    try {
        const guild = await client.guilds.fetch(guildId);
        console.log(`\n🚀 Starting setup for: ${guild.name}\n`);

        // Step 1: Create roles
        console.log('📝 Creating roles...');
        const createdRoles = {};

        for (const roleConfig of serverConfig.roles) {
            const existingRole = guild.roles.cache.find(r => r.name === roleConfig.name);
            if (existingRole) {
                console.log(`   ✓ Role already exists: ${roleConfig.name}`);
                createdRoles[roleConfig.name] = existingRole;
                continue;
            }

            const permissions = roleConfig.permissions.map(p => PermissionFlagsBits[p]);
            const role = await guild.roles.create({
                name: roleConfig.name,
                color: roleConfig.color,
                permissions: permissions,
                hoist: roleConfig.hoist || false,
            });
            createdRoles[roleConfig.name] = role;
            console.log(`   ✓ Created role: ${roleConfig.name}`);
        }

        // Step 2: Create categories and channels
        console.log('\n📁 Creating categories and channels...');

        for (const categoryConfig of serverConfig.categories) {
            let category = guild.channels.cache.find(
                c => c.name === categoryConfig.name && c.type === ChannelType.GuildCategory
            );

            if (!category) {
                category = await guild.channels.create({
                    name: categoryConfig.name,
                    type: ChannelType.GuildCategory,
                    position: categoryConfig.position,
                });
                console.log(`\n   📂 Created category: ${categoryConfig.name}`);
            } else {
                console.log(`\n   📂 Category already exists: ${categoryConfig.name}`);
            }

            for (const channelConfig of categoryConfig.channels) {
                const existingChannel = guild.channels.cache.find(
                    c => c.name === channelConfig.name && c.parentId === category.id
                );

                if (existingChannel) {
                    console.log(`      ✓ Channel already exists: ${channelConfig.name}`);
                    continue;
                }

                const permissions = getChannelPermissions(guild, channelConfig.permissions, createdRoles);

                await guild.channels.create({
                    name: channelConfig.name,
                    type: channelConfig.type,
                    parent: category.id,
                    permissionOverwrites: permissions,
                });
                console.log(`      ✓ Created channel: ${channelConfig.name}`);
            }
        }

        console.log('\n✅ Server setup complete!\n');
        console.log('📋 Next steps:');
        console.log('   1. Assign roles to team members');
        console.log('   2. Update #regras channel with server rules');
        console.log('   3. Set up ticketing bot (run: node ticketing-bot.js)');
        console.log('   4. Test permissions with each role\n');

    } catch (error) {
        console.error('❌ Error during setup:', error);
    }
}

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Replace with your server ID
    const guildId = process.env.GUILD_ID;

    if (!guildId) {
        console.error('❌ Please set GUILD_ID in your .env file');
        process.exit(1);
    }

    await setupServer(guildId);

    console.log('✅ Setup complete! You can now close this script.');
    process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
