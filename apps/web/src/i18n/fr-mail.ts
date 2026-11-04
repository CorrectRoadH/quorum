/** French presentation copy. English source messages remain the lookup keys. */
export const frMail: Readonly<Record<string, string>> = {
  '[TRIGGERED] {0}: all workers busy': '[DÉCLENCHÉ] {0} : tous les processus sont occupés',
  'ALERT TRIGGERED': 'ALERTE DÉCLENCHÉE',
  'Service: {0}\nCondition: every worker busy\nCause: mostly waiting on the database\nPool setting: none on this runtime\nSuggested action: make the database answer faster':
    "Service : {0}\nCondition : chaque processus occupé\nCause : j'attends principalement la base de données\nParamètre de pool : aucun sur ce runtime\nAction suggérée : accélérer la réponse de la base de données",
  'This alert will keep firing until a worker is free. {0} will keep telling you.':
    "Cette alerte continuera à se déclencher jusqu'à ce qu'un processus soit libre. {0} continuera à vous le dire.",
  'Your {0} workers are all on hold': 'Vos collaborateurs {0} sont tous en attente',
  'Hi there,': 'Bonjour,',
  "Quick one from {0}. Every worker on {1} is busy, and when we looked closer, most of them aren't working at all. They're waiting on the database, like a whole office stuck on hold with the same call centre.":
    "Rapide de {0}. Tous les processus du {1} sont occupés et, lorsque nous y regardons de plus près, la plupart d'entre eux ne travaillent pas du tout. Ils attendent dans la base de données, comme si tout un bureau restait en attente avec le même centre d'appels.",
  "This runtime has no pool size to turn up, so adding seats won't help. The honest fix is to make the database answer faster.":
    "Ce runtime n'a pas de taille de pool à afficher, donc l'ajout de sièges ne sera pas utile. La solution honnête consiste à accélérer la réponse de la base de données.",
  'Cheers,\nThe {0} team': "Bravo,\nL'équipe {0}",
  'New issue: {0} has no free workers': "Nouveau problème : {0} n'a pas de processus libres",
  'New issue in {0}': 'Nouveau numéro dans {0}',
  'WorkerPoolExhausted: no free worker to take the request':
    'WorkerPoolExhausted : aucun processus libre pour répondre à la demande',
  'What we see: every worker is busy, and most of that time is spent waiting on the database.':
    'Ce que nous voyons : chaque processus est occupé et la plupart de ce temps est passé à attendre sur la base de données.',
  "What won't help: there's no pool knob on this runtime.\nWhat will: make the database answer faster.":
    "Ce qui ne va pas aider : il n'y a pas de bouton de pool sur ce runtime.\nCe qui va : accélérer la réponse de la base de données.",
  "We saw it first. Now you've seen it too.\n{0}":
    "Nous l'avons vu en premier. Maintenant, vous l'avez vu aussi.\n{0}",
  'Panel annotation: {0} workers pinned': 'Annotation du panneau : processus {0} épinglés',
  'Your {0} worker panel has been a flat line at the very top for a while now. Flat at the top is just as bad as flat at the bottom.':
    'Votre panneau de travail {0} présente depuis un certain temps une ligne plate tout en haut. Plat en haut est tout aussi mauvais qu’plat en bas.',
  'We added an annotation: "every worker busy, mostly waiting on the database."':
    'Nous avons ajouté une annotation : « chaque processus est occupé, la plupart du temps en attente sur la base de données ».',
  "There's no pool setting to raise on this runtime. Make the database answer faster and the line will come back down.":
    'Il n’y a aucun paramètre de pool à augmenter sur ce runtime. Faites en sorte que la base de données réponde plus rapidement et la ligne reviendra.',
  'ESCALATED: {0} is out of workers': "ESCALADE : {0} n'a plus de collaborateurs",
  "It's late. We know. You are receiving this because you are awake.":
    'Il est tard. Nous le savons. Vous recevez cela parce que vous êtes éveillé.',
  "{0} has no idle workers left. They're mostly sitting on open database calls, waiting for answers.":
    'Il ne reste plus aucun processus inactif sur {0}. Ils sont pour la plupart assis sur des appels de bases de données ouvertes, attendant des réponses.',
  "Before you go looking for a pool size: this runtime doesn't have one. The fix is upstream. Make the database answer faster.":
    'Avant de rechercher une taille de pool : ce runtime n’en a pas. Le correctif est en amont. Rendre la base de données à répondre plus rapidement.',
  "Go back to sleep after. We'll check in.\n{0} on-call":
    'Go se rendormir après. Nous allons nous enregistrer.\n{0} de garde',
  '[TRIGGERED] {0}: {1} pool full': '[DÉCLENCHÉ] {0} : pool {1} pleine',
  'Service: {0}\nRuntime: {1}\nCondition: every worker busy\nMostly: waiting':
    "Service : {0}\nDurée d'exécution : {1}\nCondition : chaque processus occupé\nSurtout : attendre",
  'Remediation (pick one):\n1. Raise the pool\n2. Speed up the database':
    'Correction (choisissez-en une) :\n1. Surélever la pool\n2. Accélérez la base de données',
  "If nobody responds, this alert escalates to whoever is awake. Statistically, that's you.\n- {0}":
    "Si personne ne répond, cette alerte est transmise à toute personne réveillée. Statistiquement, c'est vous.\n- {0}",
  'Every {0} worker on {1} is busy': 'Chaque processus {0} sur {1} est occupé',
  'Hello from {0},': 'Bonjour de {0},',
  'Every {0} worker on {1} is taken. Most of them are just waiting, which is the most expensive kind of busy.':
    'Chaque processus {0} sur {1} est pris. La plupart d’entre eux attendent simplement, ce qui est le type d’activité le plus coûteux.',
  'You have two honest options. Raise the pool so more requests can wait at once, or speed up the database so nobody waits as long.':
    "Vous avez deux options honnêtes. Augmentez le pool pour que davantage de requêtes puissent attendre en même temps, ou accélérez la base de données pour que personne n'attende aussi longtemps.",
  'Happy to keep watching either way.': 'Heureux de continuer à regarder de toute façon.',
  'Best,\nThe {0} team': "Meilleur,\nL'équipe {0}",
  'Regression: {0} pool exhausted on {1}': 'Régression : pool {0} épuisé sur {1}',
  'Issue: PoolExhausted ({0})\nWhere: {1}\nFirst seen: just now\nLast seen: also just now':
    "Problème : Pool épuisée ({0})\nOù : {1}\nPremière vue : tout à l'heure\nVu pour la dernière fois : également tout à l'heure",
  'Every worker in the {0} pool is busy, and most are waiting rather than working.':
    'Chaque processus du pool {0} est occupé et la plupart attendent plutôt que de travailler.',
  'Suggested fixes:\n- Raise the pool\n- Speed up the database':
    'Correctifs suggérés :\n- Surélever la pool\n- Accélérer la base de données',
  "Mark as resolved when the pool has room. We'll tell you if it comes back. We always do.\n{0}":
    'Marquer comme résolu lorsque la pool a de la place. Nous vous dirons si cela revient. Nous le faisons toujours.\n{0}',
  '{0}: your {1} line hit the ceiling': '{0} : votre ligne {1} a touché le plafond',
  'Hey,': 'Hé,',
  'The "busy {0} workers" panel for {1} has climbed to the top and stayed there. No more room under the ceiling.':
    "Le panel « processus occupés de {0} » pour {1} a grimpé jusqu'au sommet et y est resté. Plus de place sous le plafond.",
  "The twist: they're mostly waiting, not computing.":
    'Le problème : ils attendent pour la plupart, pas calculent.',
  "So either raise the pool, or speed up the database. Both bring the line down. One of them also makes everything else faster, but we're a dashboard, not your mother.":
    "Alors soit augmentez le pool, soit accélérez la base de données. Les deux font baisser la ligne. L'un d'eux rend également tout le reste plus rapide, mais nous sommes un tableau de bord, pas votre mère.",
  'Timeline: {0} workers on {1}': 'Chronologie : processus de {0} sur {1}',
  'Incident timeline, {0}': 'Chronologie des incidents, {0}',
  '- Requests arrive. {0} workers pick them up.\n- Workers ask the database. Workers wait.\n- More requests arrive. More workers wait.\n- Every worker is now busy waiting. Alert fires.\n- {1} emails you. (You are here.)':
    "- Les demandes arrivent. Les processus du {0} les récupèrent.\n- Les processus demandent à la base de données. Les processus attendent.\n- D'autres demandes arrivent. D'autres processus attendent.\n- Chaque processus est maintenant occupé à attendre. Alertez les incendies.\n- {1} vous envoie un e-mail. (Vous êtes ici.)",
  'Next step: raise the pool, or speed up the database.':
    'Étape suivante : augmenter le pool ou accélérer la base de données.',
  '[TRIGGERED] Postgres: too many connections': '[DÉCLENCHÉ] Postgres : trop de connexions',
  'Component: Postgres\nError: refusing new connections\nCause: too many app processes holding pools':
    "Composant : Postgres\nErreur : refus des nouvelles connexions\nCause : trop de processus d'application détenant des pools",
  'Remediation:\n- Shrink pools, or\n- Add a Connection Pooler':
    'Correction :\n- Les pools rétractables, ou\n- Ajouter un pooleur de connexions',
  'This page will repeat until acknowledged by a human, a pet, or a cat walking across the keyboard.\n{0}':
    "Cette page se répétera jusqu'à ce qu'elle soit reconnue par un humain, un animal de compagnie ou un chat marchant sur le clavier.\n{0}",
  'Postgres has stopped answering the door': 'Postgres a cessé de répondre à la porte',
  'Hi,': 'Salut,',
  "Postgres has started refusing connections. Not because it's busy thinking, but because too many app processes are each holding a pool of connections, and the guest list is full.":
    "Postgres a commencé à refuser les connexions. Non pas parce qu'il faut réfléchir, mais parce que trop de processus d'application détiennent chacun un pool de connexions et que la liste des invités est pleine.",
  'Two ways out: shrink the pools, so each process holds fewer, or add a Connection Pooler, so they all share.':
    "Deux solutions : réduire les pools pour que chaque processus en contienne moins, ou ajouter un pooleur de connexions pour qu'ils partagent tous.",
  'Warmly,\nThe {0} team': "Chaleureusement,\nL'équipe {0}",
  'P.S. Opening more connections is not one of the two ways.':
    'P.S. Ouvrir davantage de connexions n’est pas l’une des deux manières.',
  'New issue: FATAL too many clients': 'Nouveau problème : FATAL, trop de clients',
  'New issue\nFATAL: sorry, too many clients already':
    'Nouveau numéro\nFATAL : désolé, déjà trop de clients',
  "Postgres is refusing connections. Each app process brings its own pool, and together they've used up every slot.":
    "Postgres refuse les connexions. Chaque processus d'application apporte son propre pool et, ensemble, ils ont utilisé chaque emplacement.",
  'Fix: shrink pools, or add a Connection Pooler.':
    'Correctif : réduisez les pools ou ajoutez un pooleur de connexions.',
  "This issue is assigned to you, because there's no one else. Welcome to startups.\n- {0}":
    "Cette question vous est assignée, car il n'y a personne d'autre. Bienvenue aux startups.\n- {0}",
  'Weekly digest: one panel you should look at':
    'Résumé hebdomadaire : un panneau que vous devriez consulter',
  'Your {0} digest': 'Votre résumé {0}',
  'Most panels look fine this week. One does not.':
    'La plupart des panneaux semblent en bon état cette semaine. Ce n’est pas le cas.',
  'Postgres connections: full. New ones are being refused, because too many app processes each hold their own pool.':
    'Connexions Postgres : pleines. Les nouveaux sont refusés, car trop de processus d’application détiennent chacun leur propre pool.',
  'What to try: shrink the pools, or add a Connection Pooler in front of Postgres so the processes share.':
    'Que faut-il essayer : réduisez les pools ou ajoutez un pool de connexions devant Postgres pour que les processus soient partagés.',
  "That's the digest. Short, because the rest is boring, and boring is good.":
    "C'est le résumé. Bref, parce que le reste est ennuyeux, et ennuyeux c'est bien.",
  'Re: Re: Re: Postgres connections': 'Re: Re: Re: Connexions Postgres',
  'Hello again.': 'Re-bonjour.',
  "We've mentioned this before, and we'll mention it again: Postgres is turning connections away. Too many app processes are holding pools, and there are no seats left.":
    "Nous l'avons déjà mentionné, et nous le mentionnerons à nouveau : Postgres supprime les connexions. Trop de processus d’application détiennent des pools et il ne reste plus de sièges.",
  "The fix hasn't changed. Shrink pools, or add a Connection Pooler.":
    "Le correctif n'a pas changé. Réduisez les pools ou ajoutez un pooleur de connexions.",
  'You are receiving this because you are awake, and Postgres is not taking calls.\n{0}':
    "Vous recevez ce message parce que vous êtes réveillé et que Postgres ne prend pas d'appels.\n{0}",
  '[TRIGGERED] {0}: past throughput': '[DÉCLENCHÉ] {0} : débit passé',
  'Service: {0}\nCondition: requests above its throughput\nStatus: this is the limit':
    "Service : {0}\nCondition : requêtes supérieures à son débit\nStatut : c'est la limite",
  "There's no setting in this alert to make the limit go away. {0} is doing all it can, and more is arriving.":
    "Il n'y a aucun paramètre dans cette alerte pour faire disparaître la limite. {0} fait tout ce qu’il peut et d’autres arrivent.",
  '{0}\nYou are receiving this because you are awake.':
    '{0}\nVous recevez cela parce que vous êtes éveillé.',
  "{0} is doing its best. It isn't enough.": "{0} fait de son mieux. Ce n'est pas suffisant.",
  "A gentle heads-up from {0}. {1} is being asked for more than its throughput. It's not broken and it's not misconfigured. It's simply at the limit, and the extra has nowhere to fit.":
    "Un petit avertissement de {0}. {1} est demandé plus que son débit. Il n'est pas cassé et il n'est pas mal configuré. C'est tout simplement à la limite, et le surplus n'a nulle part où rentrer.",
  "We thought you'd want to know before the users tell you.":
    'Nous avons pensé que vous voudriez le savoir avant que les utilisateurs ne vous le disent.',
  'Take care,\nThe {0} team': "Prenez soin de vous,\nL'équipe {0}",
  'Graph annotation: {0} hit its limit': 'Annotation graphique : {0} a atteint sa limite',
  'We drew a red line on the {0} panel. Your traffic line crossed it.':
    "Nous avons tracé une ligne rouge sur le panneau {0}. Votre voie de circulation l'a traversé.",
  'Annotation: "past throughput. This is the limit."':
    'Annotation: "débit passé. C\'est la limite."',
  "A flat top on a graph usually means a ceiling, and this is one. {0} can't go faster than this.":
    'Un sommet plat sur un graphique signifie généralement un plafond, et celui-ci en est un. {0} ne peut pas aller plus vite que cela.',
  'Issue: {0} over capacity': 'Problème : {0} surcapacité',
  'Issue: ThroughputExceeded\nWhere: {0}\nTrend: escalating':
    'Problème : Débit dépassé\nOù : {0}\nTendance : escalade',
  "More requests are reaching {0} than it can push through. That's its limit, not a bug we can point at a line of code for.":
    "Plus de demandes parviennent à {0} qu’il ne peut en traiter. C'est sa limite, ce n'est pas un bug pour lequel nous pouvons pointer une ligne de code.",
  "We'll keep counting. Counting is what we do.\n{0}":
    "Nous continuerons à compter. Compter, c'est ce que nous faisons.\n{0}",
  'Timeline: {0} reaches the limit': 'Chronologie : {0} atteint la limite',
  'Incident timeline': 'Chronologie des incidents',
  '- Traffic grows. {0} keeps up.\n- Traffic grows more. {1} keeps up, barely.\n- Traffic passes the throughput of {2}.\n- {3} hits the limit and stays there.\n- {4} writes this email.':
    '- Le trafic augmente. {0} suit le rythme.\n- Le trafic augmente davantage. {1} suit à peine le rythme.\n- Le trafic passe par le débit de {2}.\n- {3} atteint la limite et y reste.\n- {4} écrit cet e-mail.',
  "Root cause: {0} is past its throughput. That's the limit.":
    "Cause première : {0} a dépassé son débit. C'est la limite.",
  'Bottleneck: {0}': "Goulot d'étranglement : {0}",
  ALERT: 'ALERTE',
  'What limits the Design right now: {0}\nEverything else: has room to spare':
    'Ce qui limite actuellement le design : {0}\nTout le reste : il y a de la place disponible',
  'No further detail in this alert. {0} is the narrow part of the pipe, and the rest of the Design waits on it.':
    "Aucun autre détail dans cette alerte. {0} est la partie étroite du tuyau, et le reste de l’architecture l'attend.",
  'If you only look at one thing today': "Si tu ne regardes qu'une chose aujourd'hui",
  "We watch a lot of graphs on your behalf at {0}, and today they all agree on something: {1} is what's limiting the Design right now.":
    "Nous regardons beaucoup de graphiques en votre nom chez {0}, et aujourd'hui, ils sont tous d'accord sur quelque chose : {1} est ce qui limite actuellement l’architecture.",
  "Every other part is waiting on it. If you're wondering where to look first, look there.":
    "Toutes les autres parties l'attendent. Si vous vous demandez où chercher en premier, regardez là.",
  'All the best,\nThe {0} team': "Tout le meilleur,\nL'équipe {0}",
  '{0} is the slowest link': '{0} est le lien le plus lent',
  "Hey, it's {0}.": "Hé, c'est {0}.",
  "We lined up every panel side by side. {0} is the one holding the others back. That's what limits the Design right now.":
    "Nous avons aligné chaque panneau côte à côte. {0} est celui qui retient les autres. C'est ce qui limite actuellement le design.",
  'No flatline, no fire. Just the narrowest point in the whole thing.':
    "Pas de ligne plate, pas d'incendie. Juste le point le plus étroit de tout cela.",
  "Thought you'd want the name.": 'Je pensais que tu voudrais le nom.',
  'Top issue this hour: {0}': 'Numéro phare cette heure : {0}',
  'Top issue': 'Problème majeur',
  'LimitingFactor: {0}\nImpact: the whole Design\nSeen: every time we check':
    'Facteur limitant : {0}\nImpact : toute l’architecture\nVu : à chaque fois que nous vérifions',
  "Right now, {0} sets the pace for everything. When it's the slowest, the Design is only as fast as {1}.":
    "À l’heure actuelle, {0} donne le ton à tout. Lorsqu'il est le plus lent, le design est aussi rapide que {1}.",
  '{0}\nWe saw it first. You saw it last.':
    "{0}\nNous l'avons vu en premier. Vous l'avez vu en dernier.",
  '[ESCALATED] Design limited by {0}': '[ESCALATED] Architecture limitée par {0}',
  ESCALATED: 'ESCALADE',
  "This alert was raised, ignored by nobody, and escalated anyway, because that's how escalation works.":
    "Cette alerte a été déclenchée, ignorée par personne, et a quand même été remontée, car c'est ainsi que fonctionne l'escalade.",
  'Finding: {0} is what limits the Design right now.':
    'Constatation : {0} est ce qui limite actuellement l’architecture.',
  "That's the whole page. You are receiving this because you are awake.\n{0}":
    "C'est toute la page. Vous recevez cela parce que vous êtes éveillé.\n{0}",
  '[TRIGGERED] {0} is down': '[DÉCLENCHÉ] {0} est en panne',
  'Service: {0}\nStatus: FAILED': 'Service : {0}\nStatut : ÉCHEC',
  'Remediation:\n1. Select {0} and click Replace, or\n2. Wait for the provider':
    'Correction :\n1. Sélectionnez {0} et cliquez sur Remplacer, ou\n2. Attendez le fournisseur',
  'Use Show on Board to find it.': 'Utilisez Show on Board pour le trouver.',
  'This page will escalate until somebody does one of the above. You are receiving this because you are awake.\n{0}':
    "Cette page évoluera jusqu'à ce que quelqu'un effectue l'une des opérations ci-dessus. Vous recevez cela parce que vous êtes éveillé.\n{0}",
  '{0} has stopped responding': '{0} a cessé de répondre',
  'Sorry to be the bearer of this one. {0} has failed. Nothing is coming back from it, and our panel for it has gone flat. That is not good.':
    "Désolé d'être le porteur de celui-ci. {0} a échoué. Rien n’en ressort et notre panel est resté à plat. Ce n'est pas bon.",
  'You can select it and click Replace to put a fresh one in its place, or wait for the provider to bring it back.':
    'Vous pouvez le sélectionner et cliquer sur Remplacer pour en mettre un nouveau à sa place, ou attendre que le fournisseur le ramène.',
  'Show on Board will take you straight there.': 'Show on Board vous y emmènera directement.',
  'The {0} team': "L'équipe {0}",
  'New issue: {0} unreachable': 'Nouveau problème : {0} inaccessible',
  'New issue: NodeFailed\nWhere: {0}\nFirst seen: moments ago':
    'Nouveau problème : NodeFailed\nOù : {0}\nPremière vue : il y a quelques instants',
  'Every request to {0} is failing, because {1} itself has failed.':
    'Chaque requête adressée à {0} échoue, car {1} lui-même a échoué.',
  "Fix it yourself: select it and click Replace.\nOr don't: wait for the provider.":
    'Réparez-le vous-même : sélectionnez-le et cliquez sur Remplacer.\nOu ne le faites pas : attendez le fournisseur.',
  'Show on Board is attached.\n{0}': 'Le spectacle à bord est joint.\n{0}',
  'Timeline: {0} failure': 'Chronologie : échec du {0}',
  '- {0} is fine.\n- {1} is not fine.\n- {2} has failed.\n- {3} notices, and writes to you.\n- You read this. (You are here.)\n- Next: select it and click Replace, or wait for the provider.':
    '- {0} va bien.\n- {1} ne va pas bien.\n- {2} a échoué.\n- {3} le remarque et vous écrit.\n- Vous lisez ceci. (Vous êtes ici.)\n- Suivant : sélectionnez-le et cliquez sur Remplacer, ou attendez le fournisseur.',
  'Show on Board below.': 'Afficher à bord ci-dessous.',
  'Flatline on {0}': 'Ligne plate sur {0}',
  'Your {0} panel went flat a moment ago. Not a calm flat. A failed flat.':
    'Votre panneau {0} est tombé à plat il y a un instant. Pas un appartement calme. Un appartement raté.',
  "Two ways forward. Select it and click Replace if you'd rather not wait, or wait for the provider if you trust them more than we do.":
    "Deux voies à suivre. Sélectionnez-le et cliquez sur Remplacer si vous préférez ne pas attendre, ou attendez le fournisseur si vous lui faites plus confiance qu'à nous.",
  'Hit Show on Board to see where it sits.':
    'Appuyez sur Afficher à bord pour voir où il se trouve.',
  '[INFO] {0} restarting': '[INFO] Redémarrage de {0}',
  NOTICE: 'AVIS',
  "Service: {0}\nStatus: restarting\nImpact: requests to it fail until it's up\nAction required: none":
    "Service : {0}\nStatut : redémarrage\nImpact : les demandes échouent jusqu'à ce qu'il soit terminé\nAction requise : aucune",
  'Yes, we paged you for something that needs no action. You are receiving this because you are awake.\n{0}':
    'Oui, nous vous avons bipé pour quelque chose qui ne nécessite aucune action. Vous recevez cela parce que vous êtes éveillé.\n{0}',
  '{0} is having a little lie-down': "{0} s'allonge un peu",
  "Nothing for you to do here, just keeping you in the loop. {0} is restarting. While it is, requests to it will fail. Once it's back up, they'll go through again.":
    'Rien à faire ici, juste vous tenir au courant. {0} redémarre. Pendant ce temps, les requêtes échoueront. Une fois rétabli, ils recommenceront.',
  'No action needed. Show on Board is there if you want to watch it come back.':
    'Aucune action nécessaire. Show on Board est là si vous voulez le voir revenir.',
  'Spike in errors from {0} (expected)': "Pic d'erreurs provenant de {0} (attendu)",
  'Issue: errors from {0}\nStatus: expected':
    'Problème : erreurs provenant de {0}\nStatut : attendu',
  "{0} is restarting, so requests to it fail until it's up. The errors stop on their own.":
    "{0} redémarre, donc les demandes échouent jusqu'à ce qu'il soit terminé. Les erreurs s'arrêtent d'elles-mêmes.",
  "No action needed. We're telling you anyway, because telling you is our whole personality.\n{0}":
    "Aucune action nécessaire. Nous vous le disons quand même, car vous le dire, c'est toute notre personnalité.\n{0}",
  'Annotation: {0} restart': 'Annotation : redémarrage de {0}',
  'We\'ve marked the {0} panel with an annotation: "restarting."':
    'Nous avons marqué le panneau {0} avec une annotation : "redémarrage".',
  "The dip you'll see is requests failing while it comes back. It's temporary, and it ends when {0} is up.":
    "Le creux que vous verrez est l'échec des demandes lors de leur retour. C'est temporaire et cela se termine lorsque {0} est opérationnel.",
  "No action needed. Show on Board if you'd like to keep an eye on it.":
    'Aucune action nécessaire. Montrez-le à bord si vous souhaitez garder un œil dessus.',
  'Timeline: {0} reboot': 'Chronologie : redémarrage de {0}',
  Timeline: 'Chronologie',
  '- {0} begins restarting.\n- Requests to {1} fail.\n- You get this email.\n- {2} comes back up.\n- Requests succeed again.':
    '- {0} commence à redémarrer.\n- Les requêtes adressées à {1} échouent.\n- Vous recevez cet e-mail.\n- {2} réapparaît.\n- Les demandes réussissent à nouveau.',
  'Your part in this timeline: none. No action needed.':
    'Votre rôle dans cette chronologie : aucun. Aucune action nécessaire.',
  '[TRIGGERED] Database: full table scans':
    '[DÉCLENCHÉ] Base de données : analyses complètes de la table',
  'Component: Database\nCondition: query without an index\nEffect: whole tables scanned on every call':
    'Composant : Base de données\nCondition : requête sans index\nEffet : des tables entières analysées à chaque appel',
  'Remediation: select the Database and click Add index.':
    'Correction : sélectionnez la base de données et cliquez sur Ajouter un index.',
  'This alert is easy to fix and hard to ignore. Please do the first one.\n{0}':
    "Cette alerte est facile à corriger et difficile à ignorer. S'il vous plaît, faites le premier.\n{0}",
  'Your Database is reading every page': 'Votre base de données lit chaque page',
  'One of your queries has no index, so every time it runs the Database scans whole tables to find what it needs. Imagine looking up a word by reading the dictionary from "aardvark."':
    "L'une de vos requêtes n'a pas d'index, donc à chaque exécution, la base de données analyse des tables entières pour trouver ce dont elle a besoin. Imaginez que vous recherchez un mot en lisant le dictionnaire à partir de « oryctérope ».",
  "Good news: this one's in your hands. Select the Database and click Add index.":
    'Bonne nouvelle : celui-ci est entre vos mains. Sélectionnez la base de données et cliquez sur Ajouter un index.',
  'Thanks,\nThe {0} team': "Merci,\nL'équipe {0}",
  'New issue: SlowQuery (missing index)': 'Nouveau problème : SlowQuery (index manquant)',
  'New issue: SlowQuery\nWhere: Database\nCause: no index\nSymptom: whole-table scans\nSeen: every time the query runs':
    "Nouveau problème : SlowQuery\nOù : Base de données\nCause : pas d'index\nSymptôme : analyses de tables entières\nVu : à chaque exécution de la requête",
  'Resolution: select the Database and click Add index.':
    'Résolution : sélectionnez la base de données et cliquez sur Ajouter un index.',
  "Resolve it and we'll stop counting.\n{0}": 'Résolvez-le et nous arrêterons de compter.\n{0}',
  'That sawtooth on the Database panel': 'Cette dent de scie sur le panneau Base de données',
  'Hey, {0} here.': 'Hé, {0} ici.',
  "The Database panel has a shape we know well. It's a query with no index, so the Database scans whole tables every time.":
    "Le panneau Base de données a une forme que nous connaissons bien. Il s'agit d'une requête sans index, donc la base de données analyse des tables entières à chaque fois.",
  'The fix is one click away: select the Database and click Add index.':
    'Le correctif est à portée de clic : sélectionnez la base de données et cliquez sur Ajouter un index.',
  'After that, the panel should get boring. We like boring.':
    'Après cela, le panneau devrait devenir ennuyeux. Nous aimons ennuyeux.',
  'Re: the slow query (3 a.m. edition)': 'Re: la requête lente (édition 3h du matin)',
  "It's {0}. You are receiving this because you are awake.":
    "C'est {0}. Vous recevez cela parce que vous êtes éveillé.",
  'A query has no index. The Database answers it the hard way: by scanning whole tables.':
    "Une requête n'a pas d'index. La base de données y répond à la dure : en analysant des tables entières.",
  'You can fix it before you go back to bed. Select the Database and click Add index.':
    'Vous pouvez le réparer avant de vous recoucher. Sélectionnez la base de données et cliquez sur Ajouter un index.',
  'Goodnight, probably.': 'Bonne nuit, probablement.',
  '[TRIGGERED] Database: slow query': '[DÉCLENCHÉ] Base de données : requête lente',
  'Component: Database\nCause: query with no index\nEffect: whole tables scanned\nAdd index: not available yet':
    'Composant : Base de données\nCause : requête sans index\nEffet : tables entières numérisées\nAjouter un index : pas encore disponible',
  'Remediation:\n- Research Query analysis, or\n- Put a Cache in front':
    'Correction :\n- Analyse des requêtes de recherche, ou\n- Mettre un Cache devant',
  'A query is reading the whole library': 'Une requête lit toute la bibliothèque',
  'One of your queries has no index, so the Database scans whole tables to answer it. That gets slow fast.':
    "L'une de vos requêtes n'a pas d'index, la base de données analyse donc des tables entières pour y répondre. Cela devient vite lent.",
  "You can't add an index yet. Until you can, there are two routes: research Query analysis, so you can add one later, or put a Cache in front, so the Database is asked less often.":
    "Vous ne pouvez pas encore ajouter d'index. En attendant, il existe deux voies : rechercher l'analyse des requêtes, afin que vous puissiez en ajouter une plus tard, ou placer un cache devant, afin que la base de données soit interrogée moins souvent.",
  'New issue: SlowQuery (no index)': "Nouveau problème : SlowQuery (pas d'index)",
  'New issue: SlowQuery\nWhere: Database\nCause: missing index, whole-table scans':
    'Nouveau problème : SlowQuery\nOù : Base de données\nCause : index manquant, analyses de la table entière',
  'Workarounds while indexing is out of reach:\n1. Research Query analysis\n2. Put a Cache in front':
    "Solutions de contournement lorsque l'indexation est hors de portée :\n1. Analyse des requêtes de recherche\n2. Mettez un cache devant",
  "We'll keep this issue open. We're very good at keeping issues open.\n{0}":
    'Nous garderons ce problème ouvert. Nous sommes très doués pour garder les problèmes ouverts.\n{0}',
  'Weekly digest: one slow query': 'Résumé hebdomadaire : une requête lente',
  'One item this week. A query has no index, so the Database scans whole tables to answer it, and the panel shows it.':
    "Un article cette semaine. Une requête n'a pas d'index, donc la base de données analyse des tables entières pour y répondre et le panneau l'affiche.",
  "You can't add an index yet. Your options for now: research Query analysis, or put a Cache in front of the Database so fewer questions reach it.":
    "Vous ne pouvez pas encore ajouter d'index. Vos options pour l'instant : recherchez l'analyse des requêtes ou placez un cache devant la base de données afin que moins de questions y parviennent.",
  "That's it. See you next digest.": "C'est tout. A bientôt pour le prochain résumé.",
  'Timeline: the slow query': 'Chronologie : la requête lente',
  '- A query arrives with no index to use.\n- The Database scans whole tables.\n- It does it again. And again.\n- {0} alerts you.':
    '- Une requête arrive sans index à utiliser.\n- La base de données analyse des tables entières.\n- Ça recommence. Et encore.\n- {0} vous alerte.',
  "Next steps, since an index isn't an option yet:\n- Research Query analysis\n- Put a Cache in front":
    "Étapes suivantes, puisqu'un index n'est pas encore une option :\n- Analyse des requêtes de recherche\n- Mettre un Cache devant",
  '[TRIGGERED] {0} requests failing': '[DÉCLENCHÉ] Échec des requêtes {0}',
  "Requests: {0}\nStatus: failing\nReason: writes need the primary Database\nNote: a replica can't take them":
    'Demandes : {0}\nStatut : en échec\nRaison : les écritures nécessitent la base de données principale\nRemarque : une réplique ne peut pas les prendre',
  'Check where your {0} requests are going. They must reach the primary.':
    'Vérifiez où vont vos requêtes {0}. Ils doivent atteindre la primaire.',
  'You are receiving this because you are awake.\n{0}':
    'Vous recevez cela parce que vous êtes éveillé.\n{0}',
  'Your {0} requests are bouncing': 'Vos requêtes {0} rebondissent',
  "{0} requests are failing. Writes have to land on the primary Database, and a replica can't take them, however politely they're asked.":
    "Les requêtes {0} échouent. Les écritures doivent atterrir sur la base de données principale, et une réplique ne peut pas les accepter, aussi poliment qu'on le leur demande.",
  "If your {0} requests are heading anywhere but the primary, that's why.":
    "Si vos requêtes {0} se dirigent vers un autre endroit que le principal, c'est pourquoi.",
  'Kind regards,\nThe {0} team': "Cordialement,\nL'équipe {0}",
  'New issue: ReadOnlyReplica on {0}': 'Nouveau numéro : ReadOnlyReplica sur {0}',
  'New issue\nError: cannot execute {0} on a read-only replica':
    "Nouveau numéro\nErreur : impossible d'exécuter {0} sur une réplique en lecture seule",
  "{0} requests are failing. Writes need the primary Database. A replica can't take them, no matter how often they're retried.":
    'Les requêtes {0} échouent. Les écritures nécessitent la base de données principale. Une réplique ne peut pas les accepter, quelle que soit la fréquence de leurs tentatives.',
  'Seen: every single {0}.\n{1}': 'Vu : chaque {0}.\n{1}',
  'Your {0} success panel hit zero': 'Votre panneau de réussite {0} a atteint zéro',
  'The successful {0} requests panel has gone flat. Flat at zero. That is not good.':
    "Le panneau de demandes réussies {0} est devenu plat. Plat à zéro. Ce n'est pas bon.",
  'We annotated it: "{0} failing. Writes need the primary Database; a replica can\'t take them."':
    'Nous l\'avons annoté : "Échec de {0}. Les écritures nécessitent la base de données principale ; une réplique ne peut pas les prendre."',
  'Make sure {0} reaches the primary and the line will come back.':
    'Assurez-vous que {0} atteint le primaire et la ligne reviendra.',
  'Timeline: failing {0}s': 'Chronologie : échec des {0}',
  "- A {0} request goes out.\n- It meets a replica.\n- The replica can't take writes.\n- The {1} fails.\n- Repeat.":
    "- Une requête {0} est émise.\n- Il rencontre une réplique.\n- La réplique ne peut pas accepter d'écritures.\n- Le {1} échoue.\n- Répéter.",
  "Root cause: writes need the primary Database. A replica can't take them.":
    'Cause première : les écritures nécessitent la base de données principale. Une réplique ne peut pas les prendre.',
  'Requests: {0}\nStatus: failing\nSuggested action: check the links':
    'Demandes : {0}\nStatut : en échec\nAction suggérée : vérifiez les liens',
  'This alert will escalate until {0} requests succeed again or the sun comes up, whichever happens first. Probably the sun.\n{1}':
    "Cette alerte s'intensifiera jusqu'à ce que les requêtes {0} aboutissent à nouveau ou que le soleil se lève, selon la première éventualité. Probablement le soleil.\n{1}",
  "{0} requests aren't getting through": 'Les requêtes {0} ne parviennent pas',
  "{0} requests are failing, and they're not failing quietly. Somewhere between where they start and where they should end up, the path isn't right.":
    'Les requêtes {0} échouent, et elles n’échouent pas silencieusement. Quelque part entre le point de départ et le point où ils devraient aboutir, le chemin n’est pas le bon.',
  'Our advice: check the links. Follow a {0} request from start to finish and see where it falls off.':
    'Notre conseil : vérifiez les liens. Suivez une requête {0} du début à la fin et voyez où elle se situe.',
  'New issue: {0} failures': 'Nouveau problème : échecs du {0}',
  'New issue: RequestFailed ({0})\nSeen: again\nUsers affected: the ones sending {1}':
    'Nouveau problème : RequestFailed ({0})\nVu : encore\nUtilisateurs concernés : ceux qui envoient {1}',
  'Suggested fix: check the links.': 'Solution suggérée : vérifiez les liens.',
  "We saw it first. You saw it last. Now you've seen it twice.\n{0}":
    "Nous l'avons vu en premier. Vous l'avez vu en dernier. Maintenant, vous l'avez vu deux fois.\n{0}",
  'Your {0} graph has a hole in it': 'Votre graphique {0} comporte un trou',
  'The {0} panel looks wrong. Requests are going in and failures are coming out.':
    'Le panneau {0} semble faux. Les demandes affluent et les échecs se manifestent.',
  "We can't tell you which link is to blame from up here, but that's where to look. Check the links.":
    "Nous ne pouvons pas vous dire quel lien est à blâmer d'ici, mais c'est là qu'il faut chercher. Vérifiez les liens.",
  'Timeline: {0} outage': 'Chronologie : panne {0}',
  '- {0} requests start failing.\n- They keep failing.\n- {1} raises this alert.\n- You check the links. (Recommended next step.)\n- {2} requests succeed again. (Hopefully.)':
    "- Les requêtes {0} commencent à échouer.\n- Ils continuent d'échouer.\n- {1} déclenche cette alerte.\n- Vous vérifiez les liens. (Prochaine étape recommandée.)\n- Les requêtes {2} réussissent à nouveau. (J'espère.)",
  'You are receiving this because you are awake.': 'Vous recevez cela parce que vous êtes éveillé.',
  '[TRIGGERED] {0}: requests stranded': '[DÉCLENCHÉ] {0} : requêtes bloquées',
  'Service: {0}\nCondition: requests with nowhere to go':
    'Service : {0}\nCondition : demandes sans issue',
  'Remediation: link {0} to something that takes them.':
    'Correction : associez {0} à quelque chose qui les prend.',
  'Show on Board is attached. You are receiving this because you are awake.\n{0}':
    'Le spectacle à bord est joint. Vous recevez cela parce que vous êtes éveillé.\n{0}',
  "{0} is holding requests it can't pass on":
    "{0} retient les requêtes qu'il ne peut pas transmettre",
  "{0} has requests in hand and nowhere to send them. It's a bit like a postman with a full bag and no addresses.":
    "{0} a des demandes en cours et nulle part où les envoyer. C'est un peu comme un facteur avec un sac plein et sans adresse.",
  'The fix: link it to something that takes them.':
    'La solution : associez-le à quelque chose qui les prend.',
  'Show on Board will point you to {0}.': 'Show on Board vous dirigera vers {0}.',
  'Best wishes,\nThe {0} team': "Meilleurs vœux,\nL'équipe {0}",
  'New issue: NoRoute from {0}': 'Nouveau numéro : NoRoute de {0}',
  'New issue: NoRoute\nWhere: {0}\nMessage: request has nowhere to go\nSeen: on every one of them':
    "Nouveau numéro : NoRoute\nOù : {0}\nMessage : la demande n'a nulle part où aller\nVu : sur chacun d'eux",
  'Fix: link it to something that takes them.':
    'Correctif : associez-le à quelque chose qui les prend.',
  'Show on Board to find {0}.\n{1}': 'Présentez-vous à bord pour trouver {0}.\n{1}',
  'Arrows in, no arrows out: {0}': 'Flèches entrantes, pas de flèches sortantes : {0}',
  'Looking at the {0} panel, requests arrive and then just sit there. They have nowhere to go next.':
    'En regardant le panneau {0}, les demandes arrivent et restent là. Ils n’ont nulle part où aller ensuite.',
  'Link {0} to something that takes them, and the panel should start moving again.':
    'Liez {0} à quelque chose qui les prend et le panneau devrait recommencer à bouger.',
  'Show on Board will take you right to it.': 'Show on Board vous y mènera directement.',
  'Timeline: stranded at {0}': 'Chronologie : bloqué à {0}',
  "- Requests reach {0}.\n- {1} looks for somewhere to send them.\n- There isn't anywhere.\n- The requests wait. And wait.\n- {2} emails you.":
    "- Les demandes parviennent à {0}.\n- {1} cherche un endroit où les envoyer.\n- Il n'y a nulle part.\n- Les demandes attendent. Et attendez.\n- {2} vous envoie un e-mail.",
  'Next step: link {0} to something that takes them. Show on Board is below.':
    'Étape suivante : associez {0} à quelque chose qui les prend. Le spectacle à bord est ci-dessous.',
  '[Action required] {0}: CPU credit balance is 0':
    '[Action requise] {0} : le solde créditeur de CPU est de 0',
  'Dear valued customer,': 'Cher client,',
  'Your Burstable resource {0} has exhausted its CPU credit balance and is now throttled to 20% CPU.':
    'Votre ressource extensible {0} a épuisé son solde créditeur CPU et est désormais limitée à 20 % CPU.',
  'How credits work: a Burstable box earns credits while it runs below 20% of each core and spends them above that. Yours has been above it for a while.':
    "Comment fonctionnent les crédits : une boîte Burstable gagne des crédits tant qu'elle fonctionne en dessous de 20 % de chaque cœur et les dépense au-dessus. Le vôtre est au-dessus depuis un moment.",
  'Recommended actions:\n- Resize {0}\n- Or move it off Burstable, for example to the General family':
    'Actions recommandées :\n- Redimensionner {0}\n- Ou déplacez-le de Burstable, par exemple vers la famille Général',
  'This inbox is not monitored.\n{0}': "Cette boîte de réception n'est pas surveillée.\n{0}",
  'Your {0} is running on fumes': 'Votre {0} fonctionne aux vapeurs',
  'Quick heads-up from your account team at {0}. {1} spent every CPU credit it had, so we have politely lowered it to 20% CPU until it earns more. It only earns them while it idles below 20% of each core, which, judging by your traffic, it will not.':
    "Avis rapide de la part de votre équipe de compte au {0}. {1} a dépensé tous les crédits CPU dont il disposait, nous l'avons donc poliment réduit à 20 % de CPU jusqu'à ce qu'il gagne plus. Il ne les gagne que lorsqu'il tourne au ralenti en dessous de 20 % de chaque cœur, ce qui, à en juger par votre trafic, ne le sera pas.",
  'Resize it, or switch it off Burstable to something like General, and it can run flat out again.':
    'Redimensionnez-le ou désactivez-le Burstable en quelque chose comme Général, et il pourra à nouveau fonctionner à plein régime.',
  'Warmly (and at a discount we cannot offer),\nYour Customer Success Associate':
    'Chaleureusement (et avec une réduction que nous ne pouvons pas offrir),\nVotre associé à la réussite client',
  'EVENT: CPU_CREDITS_EXHAUSTED ({0})': 'ÉVÉNEMENT : CPU_CREDITS_EXHAUSTED ({0})',
  'Event type: CPU_CREDITS_EXHAUSTED\nResource: {0}\nStatus: Open\nImpact: CPU capped at 20%':
    "Type d'événement : CPU_CREDITS_EXHAUSTED\nRessource : {0}\nStatut : Ouvert\nImpact : CPU plafonné à 20 %",
  'Description: This Burstable resource spends credits above 20% of each core and earns them below it. The balance is now zero.':
    'Description : Cette ressource Burstable dépense des crédits au-dessus de 20 % de chaque noyau et en gagne en dessous. Le solde est désormais nul.',
  'Resolution: Resize the resource, or change its family from Burstable (for example, to General).':
    'Résolution : redimensionnez la ressource ou modifiez sa famille de Burstable (par exemple, à Général).',
  'No reply is necessary. No reply is possible.':
    "Aucune réponse n'est nécessaire. Aucune réponse n'est possible.",
  "Re: re: about {0}'s credit score": 'Re: re: à propos de la cote de crédit de {0}',
  'Hello,': 'Bonjour,',
  'We regret to inform you that {0} has a CPU credit score of zero. Like many of us, it bought more than it earned.':
    'Nous avons le regret de vous informer que {0} a une cote de crédit CPU de zéro. Comme beaucoup d’entre nous, elle a acheté plus qu’elle n’a gagné.',
  'A Burstable node saves credits whenever it runs under 20% of each core and spends them above that. Broke, it now lives on a strict budget of 20% CPU.':
    "Un nœud Burstable économise des crédits chaque fois qu'il exécute moins de 20 % de chaque cœur et les dépense au-dessus. En faillite, il vit désormais avec un strict budget de 20% CPU.",
  'Two ways out: Resize it, or retire it from Burstable to a family that does not ration, such as General.':
    'Deux solutions : redimensionnez-le ou retirez-le de Burstable dans une famille qui ne rationne pas, comme General.',
  'Thank you for choosing {0}. You had options. Fewer now.':
    "Merci d'avoir choisi {0}. Vous aviez le choix. Moins maintenant.",
  '{0} throttled to 20% (in Preview)': "{0} limité à 20 % (dans l'aperçu)",
  'Greetings from {0}!': 'Salutations de {0} !',
  "We're excited to let you know that {0} has been enrolled in our Throttling experience. It ran out of CPU credits and now runs at 20% CPU.":
    "Nous sommes ravis de vous annoncer que {0} a été inscrit à notre expérience de limitation. Il n'y avait plus de crédits CPU et fonctionne désormais à 20 % de CPU.",
  'Background: Burstable instances bank credits under 20% of each core and burn them over it.':
    'Contexte : les instances à capacité extensible accordent des crédits inférieurs à 20 % de chaque noyau et les brûlent dessus.',
  'To opt out of the experience, Resize {0} or switch it to a non-Burstable family such as General.':
    "Pour désactiver l'expérience, redimensionnez {0} ou passez-le à une famille non extensible telle que Général.",
  "We'd love your feedback! Feedback is also in Preview.":
    "Nous aimerions recevoir vos commentaires ! Les commentaires sont également dans l'aperçu.",
  '{0} is out of memory and swapping': '{0} manque de mémoire et échange',
  'Our monitoring shows that {0} has used all of its RAM and is now swapping to disk. Requests on this resource will be slow.':
    'Notre surveillance montre que {0} a utilisé la totalité de son RAM et est maintenant en train de passer sur le disque. Les requêtes sur cette ressource seront lentes.',
  'You can:\n1. Resize {0}\n2. Pick the Memory family\n3. Shrink the pool':
    'Vous pouvez :\n1. Redimensionner {0}\n2. Choisissez la famille Memory\n3. Réduire la pool',
  'We appreciate your business. We appreciate it more each month.':
    'Nous apprécions votre entreprise. Nous l’apprécions davantage chaque mois.',
  'The {0} Service Health team': 'L’équipe du Service Santé {0}',
  'Service Health: memory pressure on {0}': 'État du service : pression de la mémoire sur {0}',
  'Impact statement: Starting at an unspecified time, {0} ran out of RAM. The operating system is swapping memory pages to disk, and everything on the box now waits on it.':
    "Énoncé d'impact : À partir d'une heure indéterminée, {0} a manqué de RAM. Le système d'exploitation échange les pages de mémoire sur le disque et tout ce qui se trouve sur la boîte l'attend désormais.",
  'Current status: Ongoing. We are investigating why you have not fixed this yet.':
    "Statut actuel : En cours. Nous étudions pourquoi vous n'avez pas encore résolu ce problème.",
  'Mitigation: Resize the resource, move it to the Memory family, or shrink the pool so it needs less RAM.':
    "Atténuation : redimensionnez la ressource, déplacez-la vers la famille Mémoire ou réduisez le pool pour qu'elle nécessite moins de RAM.",
  'Next update: when you act.': 'Prochaine mise à jour : quand vous agissez.',
  'Swap is not a memory upgrade': "L'échange n'est pas une mise à niveau de mémoire",
  '{0} is out of RAM. It is swapping, which means it is pretending the disk is memory, and the disk is not enjoying the role.':
    "{0} est issu de RAM. Il s'agit d'un échange, ce qui signifie qu'il prétend que le disque est de la mémoire et que le disque ne joue pas ce rôle.",
  'Give it room: Resize it, pick the Memory family, or shrink the pool.':
    'Donnez-lui de la place : redimensionnez-le, choisissez la famille Memory ou réduisez le pool.',
  'Cheers,\nAccount team, {0}': 'Bravo,\nÉquipe de compte, {0}',
  'P.S. Your bill did not run out of memory. It remembers everything.':
    "P.S. Votre facture n'a pas manqué de mémoire. Il se souvient de tout.",
  'ALERT {0} mem=100% swap=active': 'ALERTE {0} mem=100% swap=actif',
  'ALARM: "{0}-memory" is in ALARM state.': 'ALARME : "{0}-memory" est en état d\'ALARME.',
  'Reason: RAM fully used; the node is swapping.':
    'Raison : RAM entièrement utilisé ; le nœud échange.',
  'Suggested fixes, in no order:\n- Resize\n- Memory family\n- Shrink the pool':
    'Correctifs suggérés, dans le désordre :\n- Redimensionner\n- Famille de mémoire\n- Réduire la pool',
  'You are receiving this notice because you are a {0} customer, which you agreed to on page 41 of a document you did not read.':
    "Vous recevez cet avis parce que vous êtes un client {0}, ce que vous avez accepté à la page 41 d'un document que vous n'avez pas lu.",
  "A gentle note about {0}'s memory": 'Une petite note sur la mémoire du {0}',
  "We hope this email finds you well. We're less sure it finds {0} well: it ran out of RAM and has been swapping for some time.":
    "Nous espérons que cet e-mail vous trouvera bien. Nous sommes moins sûrs qu'il trouve bien {0} : il n'a plus de RAM et il échange depuis un certain temps.",
  'When a box swaps, every request waits on the disk. Your users notice before you do.':
    "Lorsqu'une boîte échange, chaque requête attend sur le disque. Vos utilisateurs le remarquent avant vous.",
  'Resizing the node, choosing the Memory family, or shrinking the pool will each give it breathing room.':
    'Redimensionner le nœud, choisir la famille Memory ou réduire le pool lui donneront chacun une marge de manœuvre.',
  'Best regards,\nYour dedicated (shared) Technical Account Manager':
    'Cordialement,\nVotre responsable de compte technique dédié (partagé)',
  '{0}: Postgres and your app share one RAM':
    '{0} : Postgres et votre application partagent un RAM',
  '{0} is out of RAM and swapping. The cause: Postgres runs on the same box as your app, and both want the memory.':
    '{0} est sorti de RAM et échangé. La cause : Postgres s’exécute sur le même boîtier que votre application, et les deux veulent de la mémoire.',
  'Recommended action: Place a Database and link {0} to it, so Postgres gets a home of its own.':
    'Action recommandée : placez une base de données et associez-y {0} afin que Postgres ait sa propre maison.',
  'Thank you for building on {0}.\nThis inbox is not monitored.':
    "Merci d'avoir construit sur {0}.\nCette boîte de réception n'est pas surveillée.",
  'Roommate dispute detected on {0}': 'Conflit de colocation détecté sur {0}',
  'Your app and Postgres have been sharing {0} like two roommates sharing one fridge. The fridge is the RAM, and it is full. The node is swapping to disk.':
    'Votre application et Postgres partagent {0} comme deux colocataires partageant un même réfrigérateur. Le réfrigérateur est le RAM et il est plein. Le nœud passe au disque.',
  'The fix is to give Postgres its own place: Place a Database, then link {0} to it.':
    'Le correctif consiste à donner à Postgres sa propre place : placez une base de données, puis liez-y {0}.',
  'No security deposit required.': 'Aucun dépôt de garantie requis.',
  'Your Solutions Architect': 'Votre architecte de solutions',
  'Health event: {0} swapping (co-located DB)':
    'Événement d’intégrité : échange de {0} (base de données colocalisée)',
  'Event: MEMORY_EXHAUSTED_COLOCATED\nResource: {0}\nRoot cause: Postgres shares the box with the application. Combined memory exceeds RAM; the node is swapping.':
    "Événement : MEMORY_EXHAUSTED_CLOCATED\nRessource : {0}\nCause première : Postgres partage le boîtier avec l'application. La mémoire combinée dépasse RAM ; le nœud échange.",
  'Remediation: Place a Database and link the node to it.':
    'Correction : placez une base de données et liez-y le nœud.',
  'This notice was generated by {0}. It is not a contract, a promise, or a person.':
    "Cet avis a été généré par {0}. Ce n'est pas un contrat, une promesse ou une personne.",
  'Quick thought on {0}': 'Réflexion rapide sur {0}',
  'Flagging something from our side at {0}: {1} has run out of RAM and is swapping. Looking closer, Postgres is living on the same box as the app, so every query and every request are fighting for the same memory.':
    "Signalement de quelque chose de notre côté sur {0} : {1} n'a plus de RAM et est en train d'échanger. En regardant de plus près, Postgres vit sur la même boîte que l'application, donc chaque requête et chaque demande se bat pour la même mémoire.",
  'We see this a lot with early setups, and it is the right call at first. It stops being right about now.':
    "Nous le voyons souvent avec les premières configurations, et c'est la bonne décision au début. Cela n’est plus le cas maintenant.",
  'Place a Database and link {0} to it. Your app gets its RAM back, and Postgres gets a box that is only for it.':
    'Placez une base de données et associez-y {0}. Votre application récupère son RAM et Postgres reçoit une boîte qui lui est réservée.',
  'Happy to jump on a call (calls are in Preview).':
    'Heureux de répondre à un appel (les appels sont en aperçu).',
  'Best,\nYour account team': 'Meilleur,\nVotre équipe de compte',
  'Two tenants, one {0}, zero free RAM': 'Deux locataires, un {0}, zéro RAM gratuit',
  'Notice of memory exhaustion.': 'Avis d’épuisement de la mémoire.',
  'Resource {0} hosts both the application and Postgres. Together they have used all of its RAM, and the resource is now swapping.':
    "La ressource {0} héberge à la fois l'application et Postgres. Ensemble, ils ont utilisé la totalité de leur RAM et la ressource est désormais en train d'être échangée.",
  'The supported configuration is one Postgres per Database: Place a Database and link {0} to it.':
    'La configuration prise en charge est un Postgres par base de données : placez une base de données et associez-y un {0}.',
  'We apologise for any inconvenience. We have not caused any inconvenience; we are just apologising in advance.':
    "Nous nous excusons pour tout inconvénient. Nous n'avons causé aucun inconvénient; nous nous excusons simplement par avance.",
  '{0} has hit network line rate': '{0} a atteint le débit de la ligne réseau',
  '{0} is sending as many bytes as its network card can move. It is at line rate, and further traffic will queue.':
    "{0} envoie autant d'octets que sa carte réseau peut en déplacer. C'est au tarif de ligne et le trafic supplémentaire sera mis en file d'attente.",
  'Options:\n- Resize {0} for a faster network card\n- Add a copy behind a Load Balancer to split the traffic':
    'Possibilités :\n- Redimensionnez {0} pour une carte réseau plus rapide\n- Ajouter une copie derrière un Load Balancer pour diviser le trafic',
  'Egress is billed per byte. We noticed.':
    "La sortie est facturée par octet. Nous l'avons remarqué.",
  'The pipe is full': 'Le tuyau est plein',
  "Short version: {0}'s network card is moving all the bytes it can. That is line rate, and there is no line after it.":
    "Version courte : la carte réseau du {0} déplace tous les octets possibles. C'est le tarif de ligne, et il n'y a pas de ligne après.",
  'Resize it, or put a copy behind a Load Balancer so two cards share the work.':
    'Redimensionnez-le ou placez une copie derrière un répartiteur de charge afin que deux cartes partagent le travail.',
  'Thanks,\nNetworking (we are the ones you blame first)':
    'Merci,\nRéseautage (nous sommes ceux que vous blâmez en premier)',
  'Service Health: throughput saturation, {0}': 'État du service : saturation du débit, {0}',
  'Title: Network saturation on {0}\nSeverity: Warning\nRegion: One of ours. It is up, which narrows it down.':
    "Titre : Saturation du réseau sur {0}\nGravité : Avertissement\nRégion : Une des nôtres. C'est vers le haut, ce qui le réduit.",
  'Summary: Outbound traffic from {0} has reached the line rate of its network card.':
    'Résumé : Le trafic sortant de {0} a atteint le débit de ligne de sa carte réseau.',
  'Customer action: Resize the resource, or add a copy of it behind a Load Balancer.':
    'Action du client : Redimensionnez la ressource ou ajoutez-en une copie derrière un répartiteur de charge.',
  '{0} Service Health': 'État du service {0}',
  'Congratulations on your traffic!': 'Félicitations pour votre trafic !',
  'Hello!': 'Bonjour !',
  'Great news from {0}: people really want to download things from {1}. So many that its network card is now sending bytes as fast as it physically can.':
    "Excellente nouvelle de {0} : les gens veulent vraiment télécharger des éléments depuis {1}. Tellement que sa carte réseau envoie désormais des octets aussi vite qu'elle le peut physiquement.",
  'Less great news: that is the ceiling. Anything more waits in line.':
    "Moins bonne nouvelle : c'est le plafond. Tout ce qui reste fait la queue.",
  'To raise the ceiling, Resize {0}. To add a second ceiling, put a copy behind a Load Balancer.':
    'Pour surélever le plafond, redimensionnez {0}. Pour ajouter un deuxième plafond, placez une copie derrière un Load Balancer.',
  'Cheering you on (and metering you),\nYour account team':
    'Vous encourager (et vous mesurer),\nVotre équipe de compte',
  'NIC at 100% on {0}': 'Carte réseau à 100 % sur {0}',
  'Automated message.': 'Message automatisé.',
  'Metric: NetworkOut\nResource: {0}\nValue: line rate\nThreshold: line rate':
    'Métrique : Sortie réseau\nRessource : {0}\nValeur : tarif de ligne\nSeuil : débit de ligne',
  'The network card cannot move more bytes than it moves now. Resize the resource, or add a copy behind a Load Balancer.':
    "La carte réseau ne peut pas déplacer plus d'octets qu'elle n'en déplace actuellement. Redimensionnez la ressource ou ajoutez une copie derrière un répartiteur de charge.",
  'To stop receiving these alerts, stop sending bytes.':
    "Pour ne plus recevoir ces alertes, arrêtez d'envoyer des octets.",
  '{0}: working set no longer fits in RAM': '{0} : le kit de travail ne rentre plus dans RAM',
  'The working set on {0} has outgrown its RAM. Reads that used to come from memory now go to disk, which is slower by a lot.':
    "L'ensemble de travail du {0} est devenu trop grand pour son RAM. Les lectures qui provenaient auparavant de la mémoire sont désormais transférées sur le disque, ce qui est beaucoup plus lent.",
  'Recommended actions:\n- Resize {0}\n- Or pick the Memory family':
    'Actions recommandées :\n- Redimensionner {0}\n- Ou choisissez la famille Memory',
  'Thank you for your continued patience. Your disk is showing less.':
    "Merci pour votre patience continue. Votre disque s'affiche moins.",
  'Your reads are taking the stairs': 'Vos lectures prennent les escaliers',
  '{0} used to keep its hot data in RAM, where reads take the lift. The working set has grown past the RAM, so reads now take the stairs: they hit disk.':
    "{0} conservait ses données chaudes dans RAM, où les lectures prennent l'ascenseur. L'ensemble de travail a dépassé le RAM, les lectures prennent donc maintenant les escaliers : elles atteignent le disque.",
  'Resize it, or pick the Memory family, and the lift comes back.':
    "Redimensionnez-le ou choisissez la famille Memory, et l'ascenseur revient.",
  'Regards,\nStorage team': 'Cordialement,\nÉquipe de stockage',
  'Event: DISK_READS_ELEVATED on {0}': 'Événement : DISK_READS_ELEVATED sur {0}',
  'Event type: DISK_READS_ELEVATED\nAffected resource: {0}\nCause: Working set exceeds available RAM.\nEffect: Reads go to disk.':
    "Type d'événement : DISK_READS_ELEVATED\nRessource concernée : {0}\nCause : L'ensemble de travail dépasse le RAM disponible.\nEffet : les lectures sont transférées sur le disque.",
  'To resolve, Resize the resource or select the Memory family.':
    'Pour résoudre, redimensionnez la ressource ou sélectionnez la famille Mémoire.',
  'This is an automated message from {0}. Replies are routed to a folder that we sunset in a previous quarter.':
    "Il s'agit d'un message automatisé provenant de {0}. Les réponses sont acheminées vers un dossier que nous avons supprimé au cours d'un trimestre précédent.",
  'Re: {0} feels slow lately?': 'Re : {0} semble lent ces derniers temps ?',
  "If {0} has felt sluggish, here is why. Every node keeps the data it uses most, its working set, in RAM. {1}'s working set has grown bigger than its RAM, so a share of every read now goes to disk.":
    "Si {0} s’est révélé lent, voici pourquoi. Chaque nœud conserve les données qu'il utilise le plus, son ensemble de travail, dans RAM. L'ensemble de travail du {1} est devenu plus grand que celui du RAM, de sorte qu'une part de chaque lecture est désormais transférée sur le disque.",
  'Nothing is broken. It is just waiting on a spinning thing, figuratively.':
    "Rien n'est cassé. Il attend juste une chose qui tourne, au sens figuré.",
  'More RAM fixes it: Resize the node, or pick the Memory family.':
    'Plus RAM corrige le problème : redimensionnez le nœud ou choisissez la famille Mémoire.',
  'Kind regards,\nYour Technical Account Manager at {0}':
    'Cordialement,\nVotre responsable de compte technique chez {0}',
  'Disk is the new RAM (it is not)': "Le disque est le nouveau RAM (ce n'est pas le cas)",
  'Notice.': 'Remarquez.',
  "{0}'s working set does not fit in RAM anymore, so reads hit disk.":
    "L'ensemble de travail de {0} ne rentre plus dans RAM, il lit donc le disque d'accès.",
  'Fix: Resize, or the Memory family.': 'Correctif : Redimensionner ou la famille Mémoire.',
  'That is the whole email. We are as surprised as you are.':
    "C'est tout l'e-mail. Nous sommes aussi surpris que vous.",
  '{0} is at 100% CPU': '{0} est à 100% CPU',
  '{0} is using all of its CPU. Requests are queuing behind each other.':
    '{0} utilise la totalité de son CPU. Les demandes font la queue les unes derrière les autres.',
  'Recommended actions:\n- Resize {0}\n- Add a copy behind a Load Balancer':
    'Actions recommandées :\n- Redimensionner {0}\n- Ajouter une copie derrière un Load Balancer',
  'Your usage is up. So is your bill. We consider this a partnership.':
    'Votre consommation est en hausse. Votre facture aussi. Nous considérons cela comme un partenariat.',
  'ALARM: {0} CPUUtilization >= 100': 'ALARME : {0} Utilisation du processeur >= 100',
  ALARM: 'ALARME',
  'Name: {0}-cpu\nState change: OK -> ALARM\nReason: CPU at 100%.':
    "Nom : {0}-cpu\nChangement d'état : OK -> ALARME\nRaison : CPU à 100%.",
  'Runbook: Resize the resource, or add a copy behind a Load Balancer.':
    'Runbook : redimensionnez la ressource ou ajoutez une copie derrière un répartiteur de charge.',
  'You are receiving this email because someone, at some point, ticked a box.':
    "Vous recevez cet e-mail parce que quelqu'un, à un moment donné, a coché une case.",
  '{0} is giving 100%': '{0} se donne à 100 %',
  'Hi!': 'Salut !',
  'We love the hustle. {0} is giving 110%, which in CPU terms means 100% and a queue.':
    "Nous aimons l'agitation. {0} donne 110 %, ce qui, en termes de CPU, signifie 100 % et une file d'attente.",
  'Two ways to help it out: Resize it, or add a copy behind a Load Balancer so the work splits between them.':
    "Deux façons de l'aider : redimensionnez-le ou ajoutez une copie derrière un répartiteur de charge afin que le travail soit réparti entre eux.",
  'Rooting for you,\nGrowth team at {0}': 'Enracinement pour toi,\nÉquipe de croissance chez {0}',
  'P.S. A copy is a whole new Node. We will be sending a whole new invoice.':
    'P.S. Une copie est un tout nouveau nœud. Nous enverrons une toute nouvelle facture.',
  'Service Health: compute saturation on {0}': 'État du service : calculer la saturation sur {0}',
  'Impact: {0} is at 100% CPU. Work that arrives now waits for work that arrived earlier.':
    'Impact : {0} est à 100% CPU. Le travail qui arrive maintenant attend le travail arrivé plus tôt.',
  'Status: Investigating. Our investigation consists of this email.':
    'Statut : Enquête. Notre enquête porte sur cet email.',
  'Workaround: Resize the resource, or add a copy of it behind a Load Balancer.':
    'Solution de contournement : redimensionnez la ressource ou ajoutez-en une copie derrière un répartiteur de charge.',
  'All other regions are operating normally, the three of them we can see.':
    'Toutes les autres régions fonctionnent normalement, les trois que nous pouvons voir.',
  "Your CPU called. It's busy.": "Votre CPU a appelé. C'est occupé.",
  'We tried to reach {0} about something unrelated, but it is at 100% CPU and could not pick up.':
    "Nous avons essayé de joindre {0} à propos de quelque chose sans rapport, mais il s'agit de 100 % de CPU et nous n'avons pas pu répondre.",
  "If you'd like it to have a free moment again, Resize it to a bigger box, or add a copy behind a Load Balancer so they take turns.":
    "Si vous souhaitez qu'il ait à nouveau un moment libre, redimensionnez-le dans une boîte plus grande ou ajoutez une copie derrière un répartiteur de charge pour qu'ils se relaient.",
  'Thanks for your understanding,\nCompute Customer Experience':
    "Merci de votre compréhension,\nCalculer l'expérience client",
  '[Heads-up] {0} CPU credits running low': '[Attention] Les crédits {0} CPU sont presque épuisés',
  '{0} is spending CPU credits faster than it earns them. When the balance reaches zero, it will drop to 20% CPU.':
    "{0} dépense les crédits CPU plus rapidement qu'il n'en gagne. Lorsque le solde atteint zéro, il chute à 20 % CPU.",
  'To avoid this:\n- Switch it to General\n- Or resize it':
    'Pour éviter cela :\n- Basculez-le en Général\n- Ou redimensionnez-le',
  "{0}'s credits: a countdown": 'Le générique de {0} : un compte à rebours',
  'This is the email before the email. {0} is draining its CPU credits and will run out soon. After that, it runs at 20% CPU, and you get the other email.':
    "Il s'agit de l'e-mail avant l'e-mail. {0} épuise ses crédits CPU et sera bientôt épuisé. Après cela, il fonctionne à 20 % CPU et vous recevez l'autre e-mail.",
  'Switch it to General, or resize it, and neither of us has to send or read that one.':
    'Basculez-le sur Général ou redimensionnez-le, et aucun de nous n’aura à l’envoyer ou à le lire.',
  'Show on Board takes you right to it.': 'Show on Board vous y amène directement.',
  'Thanks,\nYour account team': 'Merci,\nVotre équipe de compte',
  'Forecast: {0} throttled to 20% soon': 'Prévisions : {0} bientôt limité à 20 %',
  'Forecast notice from {0}.': 'Avis de prévision de {0}.',
  'At the current rate, {0} will spend its last CPU credit soon. Once it does, it will be held to 20% CPU.':
    'Au rythme actuel, {0} dépensera bientôt son dernier crédit CPU. Une fois cela fait, il sera limité à 20 % CPU.',
  'This is a forecast, not an outage. Like our weather forecasts, it is in Preview, but unlike them it tends to be right.':
    "Il s'agit d'une prévision, pas d'une panne. Comme nos prévisions météorologiques, elles sont en aperçu, mais contrairement à elles, elles ont tendance à être exactes.",
  'Action: Switch {0} to General, or resize it. Show on Board will point it out.':
    'Action : Basculez {0} sur Général ou redimensionnez-le. Show on Board le fera remarquer.',
  'Low balance alert: {0}': 'Alerte de solde faible : {0}',
  "Your CPU credit balance on {0} is low and falling. We'd hate for it to hit zero, because then the node drops to 20% CPU.":
    "Votre solde créditeur CPU sur {0} est faible et en baisse. Nous détesterions qu'il atteigne zéro, car le nœud chute alors à 20 % CPU.",
  'Unlike your bank, we will not offer an overdraft. Unlike your bank, we will tell you how to fix it: switch the node to General, or resize it.':
    'Contrairement à votre banque, nous ne proposerons pas de découvert. Contrairement à votre banque, nous vous expliquerons comment y remédier : basculez le nœud en Général, ou redimensionnez-le.',
  'See it with Show on Board.': 'Voyez-le avec Show on Board.',
  'Regards,\nBilling and Burst, {0}': 'Cordialement,\nFacturation et rafale, {0}',
  'EVENT: CPU_CREDITS_DRAINING ({0})': 'ÉVÉNEMENT : CPU_CREDITS_DRAINING ({0})',
  'Event type: CPU_CREDITS_DRAINING\nResource: {0}\nCategory: scheduled (by you, by accident)\nExpected impact: CPU capped at 20% when credits reach zero':
    "Type d'événement : CPU_CREDITS_DRAINING\nRessource : {0}\nCatégorie : programmé (par vous, par accident)\nImpact attendu : CPU plafonné à 20% lorsque les crédits atteignent zéro",
  'Avoid by: switching to General, or resizing.':
    'À éviter en : passant au Général ou redimensionnant.',
  'Locate: Show on Board.': 'Localiser : Afficher à bord.',
  'This mailbox is unattended. So, it seems, is {0}.':
    'Cette boîte aux lettres est sans surveillance. Il semble donc que ce soit {0}.',
  'Your Payments drawer is full 🎉': 'Votre tiroir de paiements est plein 🎉',
  'Hi there!': 'Salut!',
  "Great news: you've made so much money that your Payments drawer is completely full! Less great news: new revenue has nowhere to go, so it is spilling, and spilled revenue is lost.":
    "Excellente nouvelle : vous avez gagné tellement d'argent que votre tiroir de paiements est complètement plein ! Moins bonne nouvelle : les nouveaux revenus n’ont nulle part où aller, ils se répandent donc et les revenus perdus sont perdus.",
  "Click Payments to collect what's in there, and the drawer has room again.":
    "Cliquez sur Paiements pour récupérer ce qu'il y a dedans et le tiroir retrouve de la place.",
  'Keep crushing it,\nThe {0} team': "Continuez à l'écraser,\nL'équipe {0}",
  'P.S. Collecting is free. Most other things are not.':
    'P.S. La collecte est gratuite. La plupart des autres choses ne le sont pas.',
  'Notice regarding your account balance': 'Avis concernant le solde de votre compte',
  'Dear Merchant,': 'Cher commerçant,',
  'This notice is to inform you that the Payments drawer associated with your account has reached capacity. Any further revenue received will not be retained and is considered lost.':
    'Cet avis a pour but de vous informer que le tiroir de paiements associé à votre compte a atteint sa capacité. Tout revenu supplémentaire perçu ne sera pas conservé et est considéré comme perdu.',
  'To restore capacity, please click Payments and collect the balance.':
    'Pour restaurer la capacité, veuillez cliquer sur Paiements et récupérer le solde.',
  'Please do not reply to this message. Replies are placed under review.':
    "Merci de ne pas répondre à ce message. Les réponses sont mises en cours d'examen.",
  'Sincerely,\n{0} Resolution Center': 'Cordialement,\nCentre de résolution {0}',
  'Money is falling on the floor': "L'argent tombe par terre",
  "Your Payments drawer is full. New revenue is spilling over the edge and we are not picking it up (we'd charge a fee to bend down).":
    'Votre tiroir de paiements est plein. Les nouveaux revenus débordent et nous ne les récupérons pas (nous facturerions des frais pour nous baisser).',
  'Click Payments to collect.': 'Cliquez sur Paiements pour collecter.',
  'Action needed: revenue is spilling': 'Action nécessaire : les revenus se répandent',
  'A quick look at your dashboard:': 'Un aperçu rapide de votre tableau de bord :',
  'Drawer: full\nIncoming revenue: spilling\nRevenue kept from the spill: none':
    'Tiroir : plein\nRevenus entrants : déversement\nRevenus retirés du déversement : aucun',
  "Every payment that arrives while the drawer is full is lost. Click Payments to collect what's waiting, and new revenue will land again.":
    'Tout paiement arrivant alors que le tiroir est plein est perdu. Cliquez sur Paiements pour collecter ce qui attend et de nouveaux revenus apparaîtront à nouveau.',
  'We make it easy to get paid. Staying paid is a separate product.':
    'Nous facilitons le paiement. Rester payé est un produit distinct.',
  'Cheers,\n{0}': 'Bravo,\n{0}',
  'Re: Case #00000: drawer at capacity': 'Re: Cas n°00000 : tiroir à pleine capacité',
  'Dear Account Holder,': 'Cher titulaire de compte,',
  'We have reviewed your account and determined that your Payments drawer is full. While it remains full, incoming revenue spills and cannot be recovered. {0} is not liable for spilled revenue, under section 9.2(c), which you may find under Legal, then More Legal.':
    "Nous avons examiné votre compte et déterminé que votre tiroir de paiements est plein. Tant qu'il reste plein, les revenus entrants débordent et ne peuvent pas être récupérés. {0} n'est pas responsable des revenus perdus, en vertu de la section 9.2(c), que vous pouvez trouver sous Légal, puis Plus Légal.",
  'Resolution: Click Payments to collect the drawer.':
    'Résolution : Cliquez sur Paiements pour récupérer le tiroir-caisse.',
  'This case will close automatically. Most things here do.':
    'Ce dossier se fermera automatiquement. La plupart des choses ici le font.',
  'Regards,\nAccount Review': 'Cordialement,\nExamen du compte',
  'You have revenue waiting': 'Vous avez des revenus en attente',
  "You have revenue sitting in your Payments drawer, and your Cash is looking a little thin. Let's fix that!":
    'Vous avez des revenus dans votre tiroir de paiements et votre trésorerie semble un peu mince. Réparons ça !',
  'Click Payments to collect it and move it into Cash.':
    'Cliquez sur Paiements pour le récupérer et le transférer en espèces.',
  'Happy selling,\nThe {0} team': "Bonne vente,\nL'équipe {0}",
  'P.S. Did you know you can view your fees on a beautiful, interactive chart?':
    'P.S. Saviez-vous que vous pouvez consulter vos frais sur un magnifique tableau interactif ?',
  'Funds available for collection': 'Fonds disponibles pour la collecte',
  'Our records indicate that revenue is held in your Payments drawer while the Cash balance on your account is low.':
    'Nos dossiers indiquent que les revenus sont conservés dans votre tiroir de paiements alors que le solde de trésorerie de votre compte est faible.',
  'These funds are not under review. We checked twice, which is a review, but a short one.':
    "Ces fonds ne sont pas à l'étude. Nous avons vérifié deux fois, ce qui est une critique, mais courte.",
  'To collect, click Payments.': 'Pour collecter, cliquez sur Paiements.',
  'Sincerely,\n{0}': 'Cordialement,\n{0}',
  'Cash low, drawer not': 'Trésorerie faible, tiroir non disponible',
  'Your Cash is low. Your Payments drawer, meanwhile, is sitting on revenue you already earned.':
    'Votre trésorerie est faible. Pendant ce temps, votre tiroir de paiements repose sur les revenus que vous avez déjà gagnés.',
  'One click fixes the mismatch: click Payments to collect, and the money moves where you can spend it.':
    "Un clic corrige l'inadéquation : cliquez sur Paiements pour collecter, et l'argent est transféré là où vous pouvez le dépenser.",
  'Your weekly {0} summary': 'Votre récapitulatif hebdomadaire {0}',
  "Here's your week at a glance:": "Voici votre semaine en un coup d'œil :",
  '- Revenue: in the Payments drawer\n- Cash: low\n- Fees: present and thriving':
    '- Revenus : dans le tiroir Paiements\n- trésorerie : faible\n- Honoraires : présents et prospères',
  'The first two would make a lovely pair. Click Payments to collect the revenue into Cash.':
    'Les deux premiers feraient une jolie paire. Cliquez sur Paiements pour collecter les revenus en espèces.',
  'See you next week,\nYour friends at {0}': 'A la semaine prochaine,\nVos amis chez {0}',
  "Don't leave money in the drawer": "Ne laissez pas d'argent dans le tiroir",
  "We noticed you've got revenue waiting in your Payments drawer while your Cash runs low. It's yours! It's just not in Cash until you collect it.":
    "Nous avons remarqué que vous avez des revenus en attente dans votre tiroir de paiements alors que votre trésorerie est faible. C'est à toi ! Ce n'est tout simplement pas en espèces tant que vous ne l'avez pas récupéré.",
  'Click Payments to bring it over.': "Cliquez sur Paiements pour l'importer.",
  'Thanks for growing with {0}. We grow a small percentage every time you do.':
    "Merci d'avoir grandi avec {0}. Nous augmentons un petit pourcentage à chaque fois que vous le faites.",
  'Cheers,\nMerchant Success': 'Bravo,\nSuccès du commerçant',
  'Your Cash balance is negative': 'Votre solde de trésorerie est négatif',
  "Two ways back: sell Nodes you don't need, or grow revenue. The first is faster.":
    "Il y a deux façons de revenir en arrière : vendre les nœuds dont vous n'avez pas besoin ou augmenter vos revenus. Le premier est plus rapide.",
  'Best,\nYour bookkeeper at {0}': 'Meilleur,\nVotre comptable chez {0}',
  'Reminder: balance overdue (to yourself)': 'Rappel : solde en souffrance (à vous-même)',
  'Dear Client,': 'Cher client,',
  'This is a friendly reminder that your Cash balance is negative.':
    'Ceci est un rappel amical que votre solde trésorerie est négatif.',
  'This is a second, less friendly reminder in the same email, to save time.':
    'Il s’agit d’un deuxième rappel, moins convivial, dans le même email, pour gagner du temps.',
  'Please review your Nodes and sell any you do not need, or grow revenue until the balance is above zero again.':
    "Veuillez examiner vos nœuds et vendre ceux dont vous n'avez pas besoin, ou augmenter vos revenus jusqu'à ce que le solde soit à nouveau supérieur à zéro.",
  'If you have already done so, please disregard this email. We checked. You have not.':
    "Si vous l'avez déjà fait, veuillez ignorer cet e-mail. Nous avons vérifié. Ce n’est pas le cas.",
  'Kind regards,\nAccounts, {0}': 'Cordialement,\nComptes, {0}',
  'Automated ledger check': 'Vérification automatisée du grand livre',
  'Account: Cash\nBalance: negative\nStatus: Rounded down, then down again':
    "Compte : Espèces\nSolde : négatif\nStatut : arrondi à l'inférieur, puis à nouveau à l'inférieur",
  'Suggested next steps:\n- Sell Nodes you do not need\n- Grow revenue':
    "Prochaines étapes suggérées :\n- Vendez des nœuds dont vous n'avez pas besoin\n- Augmenter les revenus",
  'Generated by {0}. This notice has been filed next to the last one.':
    'Généré par {0}. Cet avis a été déposé à côté du dernier.',
  'We need to talk about the red number': 'Nous devons parler du numéro rouge',
  "I was going through this month's books and hoped the red was a formatting choice. It is not: your Cash balance is negative.":
    "Je parcourais les livres de ce mois-ci et j'espérais que le rouge était un choix de formatage. Ce n’est pas le cas : votre solde trésorerie est négatif.",
  "I'm not here to judge. I've seen founders come back from worse. They usually did one of two things: sold the Nodes they weren't really using, or grew revenue. Usually the first, then the second.":
    "Je ne suis pas là pour juger. J'ai vu des fondateurs revenir du pire. Ils faisaient généralement l'une des deux choses suivantes : vendre les nœuds qu'ils n'utilisaient pas vraiment ou augmenter leurs revenus. Généralement le premier, puis le second.",
  "Let me know if you'd like me to walk through the numbers. I'm free; my hourly rate is not.":
    "Faites-moi savoir si vous souhaitez que je passe en revue les chiffres. je suis libre; mon taux horaire ne l'est pas.",
  'Warmly,\nYour accountant at {0}': 'Chaleureusement,\nVotre comptable chez {0}',
  'Quick one': 'Rapide',
  "Cash is negative. Sell the Nodes you don't need, or grow revenue. I'd start with the Nodes.":
    "La trésorerie est négative. Vendez les nœuds dont vous n'avez pas besoin ou augmentez vos revenus. Je commencerais par les nœuds.",
  'That\'s all. I\'m putting this in a folder labelled "Concerns".':
    "C'est tout. Je mets ceci dans un dossier intitulé « Préoccupations ».",
  "Reminder: this quarter's Guidance": 'Rappel : les orientations de ce trimestre',
  "Now that you're a public company, the market remembers what you tell it. This quarter, that's your Guidance: the number you promised.":
    "Maintenant que vous êtes une société cotée, le marché se souvient de ce que vous lui dites. Ce trimestre, c'est votre guidance : le chiffre que vous avez promis.",
  "Meet it. Analysts are kind to companies that do what they said, and creative with the ones that don't.":
    "Rencontrez-le. Les analystes sont gentils avec les entreprises qui font ce qu'ils disent et créatifs avec celles qui ne le font pas.",
  'Best,\nYour accountant at {0}': 'Meilleur,\nVotre comptable chez {0}',
  'Your Guidance is not a suggestion': 'Vos conseils ne sont pas une suggestion',
  'As a public company, you set Guidance for this quarter, a number promised to the market. Please plan to meet it.':
    "En tant qu'société cotée, vous fixez des prévisions pour ce trimestre, un chiffre promis au marché. Veuillez prévoir d'y répondre.",
  'For your reference, phrases such as "headwinds", "a challenging macro environment", and "quite frankly" do not count toward Guidance. We have checked the ledger for them.':
    'Pour votre information, des expressions telles que « vents contraires », « un environnement macro difficile » et « franchement » ne comptent pas dans les orientations. Nous avons vérifié leur registre.',
  'Kind regards,\nInvestor Reporting, {0}': 'Cordialement,\nRapports aux investisseurs, {0}',
  'Quarter-end checklist': 'Liste de contrôle de fin de trimestre',
  'Your quarter-end checklist from {0}:': 'Votre liste de contrôle de fin de trimestre de {0} :',
  '- Books reconciled: in progress\n- Receipts attached: some\n- Guidance met: please':
    "- Livres réconciliés : en cours\n- Reçus joints : certains\n- Conseils respectés : s'il vous plaît",
  "You're public now. You told the market a number for this quarter, and the market wrote it down. Let's meet the Guidance you set.":
    "Vous êtes public maintenant. Vous avez communiqué au marché un chiffre pour ce trimestre, et le marché l'a noté. Rencontrons les conseils que vous avez définis.",
  'Thanks,\nThe bookkeeping team': "Merci,\nL'équipe comptable",
  'About that number you promised': 'A propos de ce numéro que tu as promis',
  'A small reminder, in the spirit of public-company life: this quarter you set Guidance, and the market is holding you to it.':
    "Petit rappel, dans l'esprit de la vie d'une société cotée : ce trimestre vous fixez une Guidance, et le marché vous y oblige.",
  "I've been doing books for a long time. Private companies can have a bad quarter. Public companies have a bad quarter, a bad earnings call, and a bad week of headlines. Meet the number.":
    'Je fais des livres depuis longtemps. Les entreprises privées peuvent connaître un mauvais trimestre. Les sociétés cotées connaissent un mauvais trimestre, de mauvais résultats et une mauvaise semaine de gros titres. Rencontrez le numéro.',
  "If you need me, I'll be here, quietly highlighting cells.":
    'Si vous avez besoin de moi, je serai là pour surligner tranquillement les cellules.',
  'Cheers,\nYour accountant, {0}': 'Bravo,\nVotre comptable, {0}',
  'Guidance: the market is watching': 'Orientation : le marché veille',
  'Automated reminder': 'Rappel automatisé',
  'Company status: Public\nThis quarter: Guidance set\nAction: Meet the Guidance you set':
    "Statut de l'entreprise : Publique\nCe trimestre : orientations définies\nAction : respectez les directives que vous avez définies",
  'Guidance is the number you promised the market for the quarter. We recommend promising carefully and delivering exactly.':
    'La guidance est le chiffre que vous avez promis au marché pour le trimestre. Nous vous recommandons de promettre avec soin et de livrer exactement.',
  'Generated by {0}. Please retain for your records, as we will not.':
    'Généré par {0}. Veuillez les conserver dans vos dossiers, car nous ne le ferons pas.',
  'Quick intro: {0} x your {1}': 'Introduction rapide : {0} x votre {1}',
  'Long-time lurker, first-time emailer. We love what you are building. Like, really love it. Three partners screenshotted your Board this morning and one of them cried a little.':
    "Rôdeur de longue date, premier expéditeur d'e-mails. Nous aimons ce que vous construisez. Genre, j'adore vraiment ça. Trois partenaires ont fait une capture d'écran de votre tableau ce matin et l'un d'eux a pleuré un peu.",
  'We lead rounds, and we would like to lead your {0}. Would love to grab coffee, or a call, or a walk, whichever moves fastest.':
    "Nous menons des rondes et nous aimerions diriger votre {0}. J'adorerais prendre un café, passer un appel ou faire une promenade, selon ce qui se déroule le plus rapidement.",
  'If you are ready, hit Raise. If the timing is wrong, Decline, and we will pretend to be fine about it.':
    'Si vous êtes prêt, appuyez sur Augmenter. Si le moment n’est pas opportun, refusez, et nous ferons semblant d’être d’accord.',
  'Warmly,\nA partner at {0}': 'Chaleureusement,\nUn partenaire chez {0}',
  "{0}: we're in. Are you?": '{0} : nous y sommes. Et vous ?',
  'Founder,': 'Fondateur,',
  'Keeping this short because the market is not waiting. Other funds are circling your {0} round. We would rather lead it than read about it.':
    'Rester bref car le marché n’attend pas. D’autres fonds entourent votre tour {0}. Nous préférons le diriger plutôt que de le lire.',
  'Raise, and we move today.\nDecline, and we will be here, refreshing your metrics.':
    "Augmentez, et nous bougeons aujourd'hui.\nRefusez, et nous serons là pour actualiser vos statistiques.",
  'Sent from my phone, which is how all conviction is sent\n{0}':
    "Envoyé depuis mon téléphone, c'est ainsi que toutes les condamnations sont envoyées\n{0}",
  'On the long arc of your {0}': "Sur l'arc long de votre {0}",
  'Dear founder,': 'Cher fondateur,',
  "At {0} we do not invest in companies. We invest in decades. We have watched many Boards come and go, and yours has the quiet look of something that will still be running when our grandchildren's funds are raising.":
    "Chez {0}, nous n'investissons pas dans les entreprises. Nous investissons sur des décennies. Nous avons vu de nombreux conseils d'administration aller et venir, et le vôtre a l'air tranquille de quelque chose qui fonctionnera toujours lorsque les fonds de nos petits-enfants seront collectés.",
  'We would be honoured to lead your {0} round. Patient capital, aligned incentives, and a board seat we promise to use sparingly.':
    'Nous serions honorés de diriger votre ronde {0}. Un capital patient, des incitations alignées et un siège au conseil d’administration que nous promettons d’utiliser avec parcimonie.',
  'Should you wish to proceed, choose Raise. Should you not, Decline, and we shall wait. We are very good at waiting.':
    'Si vous souhaitez continuer, choisissez Augmenter. Si vous ne le faites pas, refusez, et nous attendrons. Nous sommes très doués pour attendre.',
  'With respect,\nThe partners of {0}': 'Avec respect,\nLes partenaires de {0}',
  'Make something users want. Then raise.':
    'Créez quelque chose que les utilisateurs veulent. Puis relancez.',
  'Some notes from our side:': 'Quelques notes de notre côté :',
  "- Default alive beats default dead.\n- Do things that don't scale, then scale them.\n- Raise when someone offers.":
    "- Le vivant par défaut bat le mort par défaut.\n- Faites des choses qui ne sont pas évolutives, puis mettez-les à l'échelle.\n- Relancez quand quelqu'un propose.",
  'Someone is offering. {0} wants to lead your {1} round.':
    "Quelqu'un propose. {0} veut diriger votre ronde {1}.",
  'Raise if you want the money. Decline if you would rather keep building on instant noodles. Both are fine. One is faster.':
    "Augmentez si vous voulez de l'argent. Refusez si vous préférez continuer à utiliser des nouilles instantanées. Les deux vont bien. L'un est plus rapide.",
  'Re: Re: your {0} (bumping this up)': 'Re: Re: votre {0} (cela augmente)',
  'Hey! Just floating this back to the top of your inbox in case it got buried under your 3 a.m. alerts.':
    'Hé! Remettez-le simplement en haut de votre boîte de réception au cas où il serait enfoui sous vos alertes de 3 heures du matin.',
  'TL;DR: we would love to lead your {0} round. We are founder-friendly, operator-led, thesis-driven, and every other hyphenated word on our website.':
    "TL;DR : nous serions ravis de diriger votre tournée {0}. Nous sommes conviviaux pour les fondateurs, dirigés par des opérateurs, axés sur des thèses et tous les autres mots avec trait d'union sur notre site Web.",
  'No pressure. (Some pressure.) Raise, and the paperwork lands before you finish your coffee. Decline, and we will circle back next quarter, as is tradition.':
    'Aucune pression. (Une certaine pression.) Augmentez et les documents atterrissent avant que vous ayez fini votre café. Refusez et nous reviendrons sur le prochain trimestre, comme le veut la tradition.',
  'P.S. Loved your last commit message.': "P.S. J'ai adoré votre dernier message de commit.",
  'Insight is for spending': 'La connaissances est pour les dépenses',
  'You have been saving Insight the way some people save string: carefully, and for no reason anyone can name. You have enough now to research something.':
    'Vous avez enregistré connaissances de la même manière que certaines personnes enregistrent une chaîne : avec soin, et sans aucune raison que quiconque puisse nommer. Vous en avez maintenant assez pour faire des recherches sur quelque chose.',
  'Open Research and spend it. Knowledge that sits in a drawer is not knowledge. It is a drawer.':
    "Ouvrez la recherche et dépensez-la. La connaissance qui se trouve dans un tiroir n’est pas une connaissance. C'est un tiroir.",
  'Yours,\n{0}': 'Le vôtre,\n{0}',
  'A short note on Insight': 'Une brève note sur connaissances',
  'You have enough Insight to research something. You have not.':
    'Vous avez suffisamment de connaissances pour rechercher quelque chose. Ce n’est pas le cas.',
  'Unspent Insight is a lesson you paid for and then declined to attend.':
    "Unspent connaissances est une leçon pour laquelle vous avez payé et que vous avez ensuite refusé d'assister.",
  'Open Research. Spend your Insight. Then return to work.':
    'Recherche ouverte. Dépensez vos connaissances. Puis retournez au travail.',
  'Something I learned the slow way': "Quelque chose que j'ai appris lentement",
  'Early in my career I kept a notebook of things I meant to learn properly. By the time I opened it, half the entries were obsolete and the other half were the causes of my outages.':
    "Au début de ma carrière, j'ai tenu un cahier des choses que je voulais apprendre correctement. Au moment où je l'ai ouvert, la moitié des entrées étaient obsolètes et l'autre moitié était à l'origine de mes pannes.",
  'You are keeping that notebook now. You have enough Insight to research something.':
    'Vous gardez ce carnet maintenant. Vous avez suffisamment de connaissances pour rechercher quelque chose.',
  'Open Research and spend your Insight. Pick the thing that bit you most recently. It will bite less.':
    'Ouvrez recherche et dépensez vos connaissances. Choisissez la chose qui vous a mordu le plus récemment. Ça mordra moins.',
  'Warmly,\n{0}': 'Chaleureusement,\n{0}',
  'P.S. Yes, I still have the notebook. No, you cannot see it.':
    "P.S. Oui, j'ai toujours le cahier. Non, vous ne pouvez pas le voir.",
  'Three questions before you build more': 'Trois questions avant de construire davantage',
  'Before you place another Node, ask yourself:': 'Avant de placer un autre nœud, demandez-vous :',
  '1. What broke last?\n2. Do I understand why?\n3. Could I learn something so it never breaks that way again?':
    "1. Qu'est-ce qui s'est cassé en dernier ?\n2. Est-ce que je comprends pourquoi ?\n3. Puis-je apprendre quelque chose pour que ça ne se reproduise plus jamais ?",
  'The answer to the third is yes. You have enough Insight to research something. Open Research and spend your Insight.':
    'La réponse à la troisième est oui. Vous avez suffisamment de connaissances pour rechercher quelque chose. Ouvrez recherche et dépensez vos connaissances.',
  'With regards,\n{0}': 'Cordialement,\n{0}',
  'You are allowed to learn things': "Vous avez le droit d'apprendre des choses",
  'A ship in harbour is safe, but that is not what ships are for. Insight in your pocket is safe too, and it is doing exactly as much.':
    'Un navire au port est en sécurité, mais ce n’est pas à cela que servent les navires. Les informations dans votre poche sont également sécurisées, et elles font exactement autant.',
  'You have enough to research something. Open Research, spend your Insight, and go find out what you have been guessing at.':
    'Vous en avez assez pour rechercher quelque chose. Ouvrez la recherche, dépensez vos connaissances et découvrez ce que vous avez deviné.',
  'Onward,\n{0}': 'En avant,\n{0}',
  'The bell is not rung by accident': 'La cloche ne sonne pas par hasard',
  'People imagine going public as a single morning: a bell, a balloon drop, a photograph. It is not. It is a long list of dull things done well.':
    "Les gens imaginent la entrée en bourse comme une seule matinée : une cloche, un largage de ballon, une photographie. Ce n'est pas. C’est une longue liste de choses ennuyeuses et bien faites.",
  'Your two dull things are these: grow to {0} users, and clear the IPO checklist. Then you may have your bell.':
    'Vos deux choses ennuyeuses sont les suivantes : passer aux utilisateurs de {0} et effacer la liste de contrôle IPO. Alors vous pourrez avoir votre cloche.',
  'With great expectations,\n{0}': 'Avec de grandes attentes,\n{0}',
  'Public is a promise': 'Le public est une promesse',
  'A private company may be wrong in private. A public one is wrong in the newspaper.':
    'Une entreprise privée peut se tromper en privé. Une information publique est erronée dans le journal.',
  'To go public, grow to {0} users and clear the IPO checklist. Both, not one. The market can count, and it reads checklists.':
    'Pour rendre public, passez aux utilisateurs de {0} et effacez la liste de contrôle IPO. Les deux, pas un. Le marché sait compter et lit les listes de contrôle.',
  'On IPOs, and on patience': 'Sur les introductions en bourse et sur la patience',
  'Hello again,': 'Re-bonjour,',
  'I was asked once what separates a company that goes public from one that merely wants to. My answer then, and now: the boring part.':
    "On m’a demandé un jour ce qui différenciait une entreprise qui s’introduisait en bourse d’une entreprise qui le souhaitait simplement. Ma réponse d'hier et d'aujourd'hui : la partie ennuyeuse.",
  'The exciting part is the user count. Grow to {0} users. The boring part is the IPO checklist, and you must clear all of it. Founders who skip the boring part become case studies, and I have taught enough of those.':
    "La partie intéressante est le nombre d’utilisateurs. Passez aux utilisateurs de {0}. La partie ennuyeuse est la liste de contrôle de l’introduction en bourse, et vous devez tout effacer. Les fondateurs qui sautent la partie ennuyeuse deviennent des études de cas, et j'en ai suffisamment enseigné.",
  'Do both, and you can go public.': 'Faites les deux et vous pourrez rendre public.',
  'Fondly,\n{0}': 'Affectueusement,\n{0}',
  'Your road to going public': 'Votre chemin pour devenir public',
  'Where you are going:\nPublic.': 'Où allez-vous :\nPublique.',
  'What stands between you and it:\n- {0} users. Grow until you have them.\n- The IPO checklist. Clear every line.':
    "Ce qui se trouve entre vous et lui :\n- Utilisateurs {0}. Grandissez jusqu'à ce que vous les ayez.\n- La liste de contrôle d'introduction en bourse. Effacez chaque ligne.",
  'What does not stand between you and it:\n- A nicer logo.\n- A bigger office.\n- My approval, which you already have.':
    "Ce qui ne s'interpose pas entre vous et lui :\n- Un logo plus joli.\n- Un bureau plus grand.\n- Mon approbation, que vous avez déjà.",
  'Before the bell, the work': 'Avant la cloche, le travail',
  'One day someone will ask you to explain your whole system in a single slide. You will be tempted to use forty. Resist.':
    'Un jour, quelqu’un vous demandera d’expliquer l’ensemble de votre système en une seule diapositive. Vous serez tenté d’en utiliser quarante. Résister.',
  'But first, earn the question. Grow to {0} users and clear the IPO checklist to go public. The first proves people want it. The second proves you can be trusted with it.':
    "Mais d’abord, méritons la question. Passez au nombre d'utilisateurs {0} et effacez la liste de contrôle IPO pour rendre public. La première prouve que les gens le veulent. La seconde prouve qu’on peut vous faire confiance.",
  'I am proud of how far you have come. Do not tell anyone I said so.':
    "Je suis fier du chemin parcouru. Ne dites à personne que je l'ai dit.",
  'The {0} round is {1} users away': "Le cycle {0} est à l'écart des utilisateurs du {1}",
  'You will want to raise the {0} round now. Everyone does. But money follows users, not wishes.':
    'Vous voudrez augmenter le tour {0} maintenant. Tout le monde le fait. Mais l’argent suit les utilisateurs, pas leurs souhaits.',
  'Grow to {0} users, and the {1} round will come to you. Until then, keep the Design healthy and the users happy.':
    'Devenez utilisateurs de {0} et le tour {1} viendra à vous. D’ici là, gardez le design sain et les utilisateurs heureux.',
  'Patiently,\n{0}': 'Patiemment,\n{0}',
  'Not yet.': 'Pas encore.',
  'Grow to {0} users. Then raise the {1} round.':
    'Passez aux utilisateurs de {0}. Relevez ensuite le tour {1}.',
  'A fundraise before its time is a distraction with paperwork attached. I will not elaborate. You will not need me to.':
    'Une collecte de fonds avant l’heure est une distraction avec de la paperasse attachée. Je ne développerai pas. Vous n’aurez pas besoin de moi.',
  'What I would do in your seat': 'Ce que je ferais à ta place',
  'You were about to ask, so here is what I would do in your seat:':
    'Vous étiez sur le point de demander, alors voici ce que je ferais à votre place :',
  '- Stop refreshing the investor pages.\n- Watch what slows your users down, and fix it.\n- Grow to {0} users.\n- Then raise the {1} round, from strength.':
    '- Arrêtez de rafraîchir les pages investisseurs.\n- Observez ce qui ralentit vos utilisateurs et corrigez-le.\n- Passer aux utilisateurs de {0}.\n- Relevez ensuite la ronde {1}, de force.',
  'That is the whole plan. Plans that fit in four lines are the only ones I trust.':
    "C'est tout le plan. Les plans qui tiennent sur quatre lignes sont les seuls auxquels je fais confiance.",
  'A word about the {0} round': 'Un mot sur la ronde {0}',
  'I have sat on both sides of the table. The founders who raised well did not have the best decks. They walked in already needing the money, because the users had arrived first.':
    'Je me suis assis des deux côtés de la table. Les fondateurs qui ont bien élevé n’avaient pas les meilleurs decks. Ils sont arrivés avec déjà besoin d’argent, car les utilisateurs étaient arrivés les premiers.',
  'Grow to {0} users to raise the {1} round. Let your users make the argument. It is the only one investors cannot interrupt.':
    "Passez aux utilisateurs de {0} pour augmenter le cycle {1}. Laissez vos utilisateurs faire valoir leur argument. C'est le seul que les investisseurs ne peuvent pas interrompre.",
  'With confidence in you,\n{0}': 'En toute confiance en vous,\n{0}',
  'Users first, then the {0}': "Les utilisateurs d'abord, puis le {0}",
  'The order of things matters more than the things. Users, then money. Never money, then users.':
    "L’ordre des choses compte plus que les choses. Les utilisateurs, puis l'argent. Jamais d'argent, donc les utilisateurs.",
  'You need {0} users to raise the {1} round. Every user you serve well tells a friend. Every user you serve slowly tells a friend too, just differently.':
    "Vous avez besoin d'utilisateurs {0} pour augmenter le tour {1}. Chaque utilisateur que vous servez bien en parle à un ami. Chaque utilisateur que vous servez en parle lentement à un ami, mais différemment.",
  'Build for them. The round will keep.': 'Construisez pour eux. Le tour restera.',
  'Yours, in no particular hurry,\n{0}': 'Le vôtre, pas particulièrement pressé,\n{0}',
  '[TRIGGERED] 1 incident: {0} is down': '[DÉCLENCHÉ] 1 incident : {0} est en panne',
  'You have 1 triggered incident assigned to you.':
    'Vous avez 1 incident déclenché qui vous est attribué.',
  'Incident: {0} failed\nStatus: TRIGGERED\nUrgency: High\nAssigned to: you (you are the whole rotation)':
    'Incident : Échec du {0}\nStatut : DÉCLENCHÉ\nUrgence : élevée\nAttribué à : vous (vous êtes toute la rotation)',
  'Resolution: select {0} and click Replace. It will not replace itself, however long you stare at it.':
    'Résolution : sélectionnez {0} et cliquez sur Remplacer. Il ne se remplacera pas, même si vous le regardez longtemps.',
  "{0}'s graph has gone flat": 'Le graphique de {0} est devenu plat',
  'The line for {0} went flat a moment ago. Flat is not calm. Flat means the node failed and is serving nothing.':
    "La ligne pour {0} est tombée à plat il y a un instant. L'appartement n'est pas calme. Flat signifie que le nœud a échoué et ne sert à rien.",
  'The fix is short: select {0} and click Replace. A fresh one takes its place.':
    'Le correctif est court : sélectionnez {0} et cliquez sur Remplacer. Un nouveau prend sa place.',
  "We'll keep watching the line so you don't have to. (You will anyway.)":
    "Nous continuerons à surveiller la file d'attente pour que vous n'ayez pas à le faire. (Vous le ferez de toute façon.)",
  'We saw {0} fall over. Now you have too.': 'Nous avons vu le {0} tomber. Maintenant, vous aussi.',
  "{0} failed. Every request sent its way is now an error, and we've counted all of them.":
    'Échec de {0}. Chaque demande envoyée est désormais une erreur, et nous les avons toutes comptées.',
  'What to do:\n1. Select {0}.\n2. Click Replace.\n3. Watch the count stop climbing.':
    'Que faire :\n1. Sélectionnez {0}.\n2. Cliquez sur Remplacer.\n3. Regardez le décompte cesser de grimper.',
  'First seen: just now\nLast seen: still now':
    "Première vue : tout à l'heure\nVu pour la dernière fois : toujours maintenant",
  '{0} failed again': '{0} a encore échoué',
  "If this feels familiar, it's because {0} has failed again. Hardware is mortal, and an instance is just hardware with a nicer name.":
    "Si cela vous semble familier, c'est parce que {0} a de nouveau échoué. Le matériel est mortel, et une instance n'est qu'un matériel avec un nom plus joli.",
  'Same drill as before: select {0} and click Replace. Nothing about the fix has changed, which is honestly the most comforting part of this email.':
    "Même exercice que précédemment : sélectionnez {0} et cliquez sur Remplacer. Rien dans le correctif n'a changé, ce qui est honnêtement la partie la plus réconfortante de cet e-mail.",
  'Regards,\nOn-call notifications, {0}': "Cordialement,\nNotifications d'astreinte, {0}",
  'ESCALATED: {0} is down': 'ESCALADE : {0} est en panne',
  'Escalation level 1 of 1': "Niveau d'escalade 1 sur 1",
  'This incident has been escalated to the next person on the rotation. The next person on the rotation is you.':
    'Cet incident a été transmis à la personne suivante de la rotation. La prochaine personne sur la rotation, c’est vous.',
  '{0} has failed and is not serving traffic. To resolve it, select {1} and click Replace.':
    '{0} a échoué et ne diffuse pas le trafic. Pour le résoudre, sélectionnez {1} et cliquez sur Remplacer.',
  'No one else is coming. We checked.': "Personne d'autre ne vient. Nous avons vérifié.",
  '{0} Incident Response': 'Réponse aux incidents {0}',
  'New issue: slow query, full table scan':
    'Nouveau problème : requête lente, analyse complète de la table',
  'New issue in production': 'Nouveau numéro en production',
  'SlowQueryWarning: a new query has no index\nEvents: every read\nFirst seen: a moment ago':
    'SlowQueryWarning : une nouvelle requête n’a pas d’index\nÉvénements : chaque lecture\nPremière vue : il y a un instant',
  'Every read now scans the whole table, row by row, like someone looking for their keys in every drawer of the house. Reads that took a blink now take a while, and the Database is doing all of it.':
    "Chaque lecture parcourt désormais toute la table, ligne par ligne, comme quelqu'un cherchant ses clés dans tous les tiroirs de la maison. Les lectures qui prenaient un clin d'œil prennent maintenant un certain temps, et la base de données fait tout cela.",
  'Database read latency is climbing': 'La latence de lecture de la base de données augmente',
  "Your Database latency panel is going up and to the right. On a revenue chart that would be good news. Here it isn't.":
    "Le panneau de latence de votre base de données monte vers la droite. Sur un tableau des revenus, ce serait une bonne nouvelle. Ici, ce n'est pas le cas.",
  'Cause: a new query has no index, so every read scans the table.':
    "Cause : une nouvelle requête n'a pas d'index, donc chaque lecture analyse la table.",
  'Kind regards,\nThe {0} alerting team': "Cordialement,\nL'équipe d'alerte {0}",
  '[TRIGGERED] Slow query on the Database': '[DÉCLENCHÉ] Requête lente sur la base de données',
  'Incident: slow query\nService: Database\nUrgency: High':
    'Incident : requête lente\nService : Base de données\nUrgence : élevée',
  'Summary: a new query shipped without an index. Each read now scans the table end to end instead of jumping to the row it wants. The scans pile up, and everything waiting on the Database waits longer.':
    "Résumé : une nouvelle requête expédiée sans index. Chaque lecture analyse désormais le tableau de bout en bout au lieu de passer à la ligne souhaitée. Les analyses s'accumulent et tout ce qui attend dans la base de données attend plus longtemps.",
  "Re: slow query (it's back)": "Re : requête lente (c'est de retour)",
  'Hi again,': 'Re-bonjour,',
  "Another query without an index. Same story as last time: there's nothing to look rows up by, so every read scans the table from the first row to the last.":
    "Une autre requête sans index. Même histoire que la dernière fois : il n'y a rien à vérifier dans les lignes, donc chaque lecture analyse le tableau de la première ligne à la dernière.",
  "Somewhere a Database is reading the phone book to find one number. It's yours.":
    "Quelque part, une base de données lit l'annuaire téléphonique pour trouver un numéro. C'est à toi.",
  'Your table is being read cover to cover': "Votre tableau est lu d'un bout à l'autre",
  "Quick heads-up: a new query arrived without an index. That means no shortcuts. Every read walks the full table, and the Database's day just got a lot longer.":
    'Attention rapide : une nouvelle requête est arrivée sans index. Cela signifie pas de raccourcis. Chaque lecture parcourt le tableau complet et la journée de la base de données est devenue beaucoup plus longue.',
  'Reads stay slow until this is over.':
    "Les lectures restent lentes jusqu'à ce que ce soit terminé.",
  'P.S. "It was fast on my laptop" is true. Your laptop has eleven rows.':
    'P.S. "C\'était rapide sur mon ordinateur portable" est vrai. Votre ordinateur portable comporte onze lignes.',
  '[TRIGGERED] Poison message in the queue':
    "[DÉCLENCHÉ] Message empoisonné dans la file d'attente",
  'Incident: poison message\nUrgency: High': 'Incident : message empoisonné\nUrgence : élevée',
  "One task keeps failing. The workers keep retrying it instead of draining the queue, so the line behind it isn't moving.":
    "Une tâche continue d'échouer. Les processus continuent de réessayer au lieu de vider la file d'attente, de sorte que la file d'attente derrière ne bouge pas.",
  "The task is not going to succeed on attempt 400. It didn't on attempt 3.":
    'La tâche ne réussira pas à la tentative 400. Elle n’a pas réussi à la tentative 3.',
  'The same task failed. And failed. And failed.': 'La même tâche a échoué. Et échoué. Et échoué.',
  "We've grouped these into one issue because they're all the same: one task, failing, over and over.":
    'Nous les avons regroupés en un seul problème car ils sont tous identiques : une tâche, qui échoue, encore et encore.',
  "What's happening: your workers retry the failing task instead of draining the queue. That's a poison message. Everything queued behind it waits.":
    "Que se passe-t-il : vos collaborateurs réessayent la tâche qui a échoué au lieu de vider la file d'attente. C'est un message empoisonné. Tout ce qui est en file d'attente derrière attend.",
  'Events: still counting\nUsers affected: everyone in line':
    'Événements : ça compte toujours\nUtilisateurs concernés : tout le monde en ligne',
  'Queue depth: up. Work done: flat.':
    "Profondeur de la file d'attente : vers le haut. Travaux réalisés : à plat.",
  'Two of your panels disagree. Queue depth keeps rising. Work completed has gone flat.':
    'Deux de vos panels ne sont pas d’accord. La profondeur de la file d’attente ne cesse d’augmenter. Les travaux terminés sont restés à plat.',
  'The reason is a single task that keeps failing. The workers retry it again and again rather than draining the queue, so new work just stacks up.':
    "La raison en est une tâche unique qui échoue constamment. Les processus réessayent encore et encore plutôt que de vider la file d'attente, de sorte que les nouveaux travaux s'accumulent.",
  "The graph isn't broken. The queue is.": "Le graphique n'est pas brisé. La file d'attente est.",
  'Re: poison message, again': 'Re : Message empoisonné, encore une fois',
  "A task that can't succeed is back on the menu. The workers are retrying it instead of working through the queue, which is loyal of them but not useful.":
    "Une tâche qui ne peut pas réussir est de retour au menu. Les processus réessayent au lieu de travailler dans la file d'attente, ce qui leur est fidèle mais inutile.",
  'The queue fills up while they try.': "La file d'attente se remplit pendant qu'ils essaient.",
  'Best,\n{0}': 'Meilleur,\n{0}',
  'Incident opened: queue not draining': "Incident ouvert : la file d'attente ne se vide pas",
  'Dear on-call engineer,': "Cher ingénieur d'astreinte,",
  'At the time of writing, a task in your queue has failed every attempt. Workers continue to retry it in preference to draining the queue. In the industry this is known as a poison message; in the office it is known as "why is everything stuck".':
    'Au moment de la rédaction de cet article, une tâche dans votre file d\'attente a échoué à chaque tentative. Les processus continuent de réessayer plutôt que de vider la file d’attente. Dans l’industrie, c’est ce qu’on appelle un message empoisonné ; au bureau, on dit "pourquoi tout est bloqué".',
  'This notice will be followed by more notices.': 'Cet avis sera suivi d’autres avis.',
  'Sincerely,\n{0} Incident Management': 'Cordialement,\nGestion des incidents {0}',
  'HTTP DDoS attack alert: your edge': "HTTP DDoS alerte d'attaque : votre avantage",
  'HTTP DDoS Attack Alert': 'HTTP DDoS Alerte d’attaque',
  'Description: a flood of junk traffic is hitting your edge.\nDetected: just now\nAttack type: HTTP flood, artisanal\nMaximum rate: yes\nAttack target: you\nRule that matched: "Requests that want nothing"':
    "Description : un flot de trafic indésirable frappe votre périphérie.\nDétecté : tout à l'heure\nType d'attaque : Inondation HTTP, artisanale\nTarif maximum : oui\nCible de l'attaque : vous\nRègle qui correspond : \"Demandes qui ne veulent rien\"",
  'We are standing between the flood and your Design. We are very large, and we would like you to remember that at renewal time.':
    'Nous nous tenons entre le déluge et votre Architecture. Nous sommes très grands et nous aimerions que vous vous en souveniez au moment du renouvellement.',
  'Checking if your traffic is human...': 'Vérifier si votre trafic est humain...',
  'Checking if your traffic is human. This may take a few seconds.':
    'Vérifier si votre trafic est humain. Cela peut prendre quelques secondes.',
  'It is not human.': "Ce n'est pas humain.",
  'A flood of junk traffic is hitting your edge. We have met botnets before, but this one has range: smart fridges, a parking meter, and at least one baby monitor, all asking for your home page at once.':
    "Un flot de trafic indésirable frappe votre bord. Nous avons déjà rencontré des botnets, mais celui-ci a une portée : des réfrigérateurs intelligents, un parcomètre et au moins un babyphone, tous demandant votre page d'accueil en même temps.",
  'Please stand by.': "S'il vous plaît, restez là.",
  'The {0} Trust & Safety team': "L'équipe Confiance & Sécurité du {0}",
  'Attention Required! Your edge is under attack': 'Attention requise ! Votre avantage est attaqué',
  'Attention Required!': 'Attention requise !',
  'What happened?\nA flood of junk traffic is hitting your edge. None of these requests want to buy anything. They only want to arrive, all of them, at the same time.':
    "Que s'est-il passé ?\nUn flot de trafic indésirable frappe votre bord. Aucune de ces demandes ne veut acheter quoi que ce soit. Ils veulent seulement arriver, tous en même temps.",
  'What can I do?\nIf you are a visitor: nothing. You are probably a toaster.\nIf you own the site: watch the Board and see how your Design takes a wave this size.':
    'Que puis-je faire ?\nSi vous êtes visiteur : rien. Vous êtes probablement un grille-pain.\nSi vous possédez le site : regardez le tableau et voyez comment votre architecture prend une vague de cette taille.',
  'Ray ID: 8b0f13c7a2e9\nPerformance & security by {0}':
    'ID de rayon : 8b0f13c7a2e9\nPerformances et sécurité par {0}',
  'Sorry, they have been blocked (not you)': 'Désolé, ils ont été bloqués (pas vous)',
  'Sorry, you have been blocked.': 'Désolé, vous avez été bloqué.',
  'Not you. Them. A flood of junk traffic is hitting your edge, and we are showing them this page a few million times a minute.':
    'Pas toi. Eux. Un flot de trafic indésirable atteint votre limite, et nous leur montrons cette page quelques millions de fois par minute.',
  'Somewhere in the queue are your real users, on their ninth picture of traffic lights. They would like you to know they found every bicycle.':
    "Quelque part dans la file d'attente se trouvent vos vrais utilisateurs, sur leur neuvième photo de feux tricolores. Ils aimeraient que vous sachiez qu'ils ont trouvé chaque vélo.",
  'Regards,\nThe {0} Edge': 'Cordialement,\nLe bord {0}',
  'Re: the flood (it is still flooding)': "Re : l'inondation (c'est toujours l'inondation)",
  'The junk traffic at your edge has not let up. If anything, it brought friends.':
    'Le trafic indésirable à votre périphérie n’a pas diminué. Au contraire, cela a amené des amis.',
  'Our network handles a very large share of the internet, and today a worrying part of that share is about you. Congratulations on being popular with the wrong crowd.':
    'Notre réseau gère une très grande part d’Internet, et aujourd’hui, une partie inquiétante de cette part vous concerne. Félicitations, vous êtes populaire auprès du mauvais public.',
  'Still standing,\n{0}': 'Toujours debout,\n{0}',
  'P.S. If half the internet goes dark later today, that one is on us, not them.':
    'P.S. Si la moitié d’Internet devient sombre plus tard dans la journée, c’est sur nous, pas sur eux.',
  '[TRIGGERED] Cache stampede': '[Déclenché] Bousculade du cache',
  'Incident: cache stampede\nServices: Cache, Database\nUrgency: High':
    'Incident : bousculade de cache\nServices : Cache, Base de données\nUrgence : élevée',
  'The Cache restarted empty. Every request is now a miss, and every miss goes straight to the Database. All at once. Together. Like a herd.':
    'Le cache a redémarré vide. Chaque requête est désormais un échec, et chaque échec va directement dans la base de données. Tout à coup. Ensemble. Comme un troupeau.',
  'Cache hit rate: 0%. Database: not okay.':
    "Taux de réussite du cache : 0 %. Base de données : pas d'accord.",
  'Your cache hit rate fell to zero the moment the Cache restarted. It came back empty, with nothing in it to serve.':
    'Votre taux de réussite du cache est tombé à zéro au moment du redémarrage du cache. Il est revenu vide, sans rien à servir.',
  'So every miss goes to the Database, and the Database panel now looks like a cliff face drawn upside down.':
    "Ainsi, chaque échec est envoyé à la base de données, et le panneau de base de données ressemble désormais à une falaise dessinée à l'envers.",
  'Brace yourself.': 'Préparez-vous.',
  'Database load jumped after a Cache restart':
    'La charge de la base de données a sauté après un redémarrage du cache',
  'Database load just jumped. We traced it back: the Cache restarted empty, and now every request misses and runs to the Database for the answer.':
    "La charge de la base de données vient de sauter. Nous l'avons retracé : le cache a redémarré vide, et maintenant chaque requête manque et est dirigée vers la base de données pour obtenir la réponse.",
  'This is called a cache stampede. Your Database is the thing being stampeded.':
    'C’est ce qu’on appelle une ruée vers les caches. Votre base de données est la chose qui est tamponnée.',
  'First seen: right after the restart': 'Première vue : juste après le redémarrage',
  'Re: cache stampede (another one)': 'Re : Cache Stampede (un autre)',
  'The Cache restarted empty again, and the herd is back: every miss heading to the Database at the same time.':
    'Le Cache redémarré vide, et le troupeau est de retour : tous les ratés se dirigent vers la Base de données en même temps.',
  "Nothing personal against your Database. It's just the only one left who knows the answers.":
    "Rien de personnel contre votre base de données. C'est juste le seul qui reste à connaître les réponses.",
  'Your Cache woke up with amnesia': "Votre Cache s'est réveillé avec l'amnésie",
  "Good morning (it's always morning somewhere on call),":
    "Bonjour (c'est toujours le matin quelque part de garde),",
  "The Cache restarted, and it came back remembering nothing. That's normal for a cache. What isn't fun is what happens next: every request misses, and every miss goes to the Database.":
    "Le cache a redémarré et il est revenu sans se souvenir de rien. C'est normal pour un cache. Ce qui n'est pas amusant, c'est ce qui se passe ensuite : chaque requête échoue et chaque échec est envoyé à la base de données.",
  'Picture a library where the front desk forgot every answer, so everyone walks to the archive at once. The archive is your Database.':
    "Imaginez une bibliothèque où la réception a oublié toutes les réponses, alors tout le monde se rend aux archives en même temps. L'archive est votre base de données.",
  'Regards,\n{0} Incident Response': 'Cordialement,\nRéponse aux incidents {0}',
  '[TRIGGERED] Zone {0} is down': '[DÉCLENCHÉ] La zone {0} est indisponible',
  'Incident: zone outage\nZone: {0}\nUrgency: High\nStatus: TRIGGERED':
    'Incident : panne de zone\nZone : {0}\nUrgence : élevée\nStatut : DÉCLENCHÉ',
  'Zone {0} is down. Everything you run there is unreachable until it comes back.':
    "La zone {0} est indisponible. Tout ce que vous exécutez là-bas est inaccessible jusqu'à ce qu'il revienne.",
  "You are hearing this before the status page says anything. That's the service.":
    "Vous entendez cela avant que la page d’état ne dise quoi que ce soit. C'est le service.",
  'Every panel for zone {0} just went flat': 'Chaque panneau de la zone {0} vient de tomber à plat',
  "A whole row of your dashboard flatlined at once. That isn't a coincidence: zone {0} is down.":
    "Une ligne entière de votre tableau de bord s'est aplatie en même temps. Ce n'est pas une coïncidence : la zone {0} est indisponible.",
  'One flat graph is bad luck. A zone of them is geography.':
    'Un graphique plat porte malheur. Une de leurs zones est la géographie.',
  'Errors from everything in zone {0}': 'Erreurs de tout dans la zone {0}',
  'We got a burst of errors from every node in zone {0} at the same moment, so we checked: the zone itself is down.':
    "Nous avons reçu une salve d'erreurs de chaque nœud de la zone {0} au même moment, nous avons donc vérifié : la zone elle-même est en panne.",
  'This is not a bug in your code. This time.': "Ce n'est pas un bug dans votre code. Cette fois.",
  "We saw it first. You're seeing it now.": "Nous l'avons vu en premier. Vous le voyez maintenant.",
  'Zone {0} is down again': 'La zone {0} est à nouveau indisponible',
  'Zone {0} has gone down again. Same zone, same outage, same sinking feeling.':
    'La zone {0} est à nouveau en baisse. Même zone, même panne, même sensation de naufrage.',
  "We'd tell you the provider's status page still shows all green, but you've probably guessed that already.":
    'Nous vous dirions que la page d’état du fournisseur est toujours entièrement verte, mais vous l’avez probablement déjà deviné.',
  'Availability event: zone {0}': 'Événement de disponibilité : zone {0}',
  'AVAILABILITY EVENT': 'ÉVÉNEMENT DE DISPONIBILITÉ',
  'Affected zone: {0}\nState: down\nAffected resources: everything in zone {1}':
    'Zone concernée : {0}\nEtat : vers le bas\nRessources concernées : tout ce qui se trouve dans la zone {1}',
  'A zone outage is in progress. Resources in the other zones are not affected by this event. Resources in zone {0} are very affected by this event.':
    'Une panne de zone est en cours. Les ressources des autres zones ne sont pas affectées par cet événement. Les ressources de la zone {0} sont très affectées par cet événement.',
  'Updates will follow when there is something to update.':
    "Les mises à jour suivront lorsqu'il y aura quelque chose à mettre à jour.",
  '[SEV1] Data breach: an advisory you did not patch':
    "[SEV1] Violation de données : un avis que vous n'avez pas corrigé",
  'Incident: data breach\nUrgency: Critical': 'Incident : violation de données\nUrgence : critique',
  'Someone used a vulnerability that was disclosed to you, with a deadline, and the deadline passed. Customer data left the building. Users are leaving after it.':
    "Quelqu'un a utilisé une vulnérabilité qui vous a été divulguée, avec un délai, et le délai a été dépassé. Les données des clients ont quitté le bâtiment. Les utilisateurs partent après.",
  'The ticket is gone from the backlog. The consequence is not.':
    'Le ticket n’est plus dans l’arriéré. La conséquence ne l’est pas.',
  'We told you so (it was in the backlog)': "On vous l'avait bien dit (c'était dans le backlog)",
  'The advisory that was on your backlog, in red, got exploited. Data is out. A share of your Users have read the news and are going elsewhere.':
    "L'avis qui figurait sur votre carnet de commandes, en rouge, a été exploité. Les données sont sorties. Une part de vos utilisateurs ont lu l’actualité et partent ailleurs.",
  'There is no button for this one. It will pass. Patch the next one on time.':
    "Il n'y a pas de bouton pour celui-ci. Cela passera. Patchez le suivant à temps.",
  'Sincerely,\nThe {0} team': "Cordialement,\nL'équipe {0}",
  'Breach confirmed': 'Violation confirmée',
  'Confirmed: the vulnerability on your overdue ticket was exploited.':
    'Confirmé : la vulnérabilité sur votre ticket en retard a été exploitée.',
  'Impact: customer data, Users, and trust, in that order.\nStatus: ongoing\nRoot cause: a ticket that was not built before its deadline':
    'Impact : données client, utilisateurs et confiance, dans cet ordre.\nStatut : en cours\nCause première : un ticket qui n’a pas été construit avant sa date limite',
  '[TRIGGERED] Payment Provider down': '[DÉCLENCHÉ] Fournisseur de paiement en panne',
  'Incident: payment provider outage\nService: Payments\nUrgency: High':
    'Incident : panne du fournisseur de paiement\nService : Paiements\nUrgence : élevée',
  'The Payment Provider is down, so checkouts are failing. Customers are filling their carts and leaving with nothing.':
    'Le fournisseur de paiement est en panne, les paiements échouent donc. Les clients remplissent leur panier et repartent sans rien.',
  "This one isn't your code. It's still your revenue.":
    "Celui-ci n'est pas votre code. C'est toujours votre revenu.",
  'Checkouts have gone flat': 'Les caisses sont devenues stables',
  "Your successful checkouts panel just went flat. Traffic is still there and carts are still filling. The money isn't arriving.":
    "Votre panneau de paiement réussi est tombé à plat. La circulation est toujours là et les chariots se remplissent toujours. L'argent n'arrive pas.",
  'The Payment Provider is down, so every checkout fails at the very last step.':
    'Le fournisseur de paiement est en panne, donc chaque paiement échoue à la toute dernière étape.',
  'PaymentError: provider unavailable': 'PaymentError : fournisseur indisponible',
  "New issue: every checkout is failing with the same error. The Payment Provider is down and isn't answering.":
    'Nouveau problème : chaque paiement échoue avec la même erreur. Le fournisseur de paiement est en panne et ne répond pas.',
  'Users affected: everyone who tried to pay you\nFirst seen: just now':
    "Utilisateurs concernés : tous ceux qui ont tenté de vous payer\nPremière vue : tout à l'heure",
  "We know. It's the one error you wanted fewer of.":
    "Nous le savons. C'est la seule erreur dont vous vouliez moins.",
  'Re: Payment Provider down (again)': 'Re : Fournisseur de paiement en panne (à nouveau)',
  "The Payment Provider is down again, and checkouts are failing again. Customers want to give you money. The pipe between them and you isn't working.":
    "Le fournisseur de paiement est à nouveau en panne et les caisses échouent à nouveau. Les clients veulent vous donner de l'argent. Le tuyau entre eux et vous ne fonctionne pas.",
  "We'll let you know when it's over.": 'Nous vous ferons savoir quand ce sera fini.',
  'Regards,\n{0}': 'Cordialement,\n{0}',
  'Your customers are trying to pay you': 'Vos clients essaient de vous payer',
  "It's a lovely problem to describe and a terrible one to have: people want to buy, and they can't. The Payment Provider is down, so checkouts fail.":
    "C'est un problème agréable à décrire et terrible à vivre : les gens veulent acheter, mais ils ne le peuvent pas. Le fournisseur de paiement est en panne, donc les paiements échouent.",
  'Nothing on your side caused it. Nothing on your side is earning while it lasts, either.':
    'Rien de votre côté n’en est la cause. Rien de votre côté non plus ne rapporte tant que cela dure.',
  'Sorry to be the one,\n{0}': "Désolé d'être celui-là,\n{0}",
  '[RESOLVED] {0}': '[RÉSOLU] {0}',
  'The following incident has been resolved:': "L'incident suivant a été résolu :",
  '{0}\nStatus: RESOLVED\nDuration: long enough': '{0}\nStatut : RÉSOLU\nDurée : assez longue',
  "You may now go back to whatever you were doing before. We don't remember what it was either.":
    "Vous pouvez maintenant reprendre ce que vous faisiez auparavant. Nous ne nous souvenons pas non plus de ce que c'était.",
  '[OK] {0} has cleared': '[OK] {0} a été effacé',
  'Good news, for once: {0} is over. The graphs are back to the shapes you like. Not flat, not cliffs, just lines.':
    'Bonne nouvelle, pour une fois : {0} est terminé. Les graphiques reprennent les formes que vous aimez. Pas de plat, pas de falaises, juste des lignes.',
  "We'll keep watching. You should sleep.": 'Nous continuerons à surveiller. Tu devrais dormir.',
  'Resolved: {0}': 'Résolu : {0}',
  "We've marked {0} as resolved. No new events since it ended.":
    'Nous avons marqué {0} comme résolu. Aucun nouvel événement depuis la fin.',
  "If it comes back, we'll flag it as a regression and tell you right away. We always see it first.":
    'Si cela revient, nous le signalerons comme une régression et vous le dirons immédiatement. Nous le voyons toujours en premier.',
  'Re: {0} — all clear': 'Re: {0} — tout est clair',
  'All clear.': 'Tout est clair.',
  '{0} is over. Nothing left to do on this one but breathe out.':
    "{0} est terminé. Il ne reste plus qu'à expirer.",
  'Thanks for sticking with it. Most people would have put their phone in a drawer by now.':
    'Merci de vous y tenir. La plupart des gens auraient déjà mis leur téléphone dans un tiroir.',
  'Incident closed: {0}': 'Incident clôturé : {0}',
  'INCIDENT CLOSED': 'INCIDENT CLÔTÉ',
  'Incident: {0}\nState: resolved\nPostmortem action items: none listed':
    'Incident : {0}\nEtat : résolu\nActions post-mortem : aucune répertoriée',
  'This incident has ended.': 'Cet incident est terminé.',
  "Thank you for your patience. Your users thank you less, but they're back.":
    'Merci pour votre patience. Vos utilisateurs vous remercient moins, mais ils sont de retour.',
  '[RESOLVED] {0} + 1 action item': "[RÉSOLU] {0} + 1 élément d'action",
  '{0} has been resolved.': '{0} a été résolu.',
  'Postmortem action item:\n- Research {0}': 'Action post-mortem :\n- Recherche {0}',
  'Until {0} is researched, {1} is twice as likely to happen again. We\'d say "no pressure", but that would be a lie.':
    "Jusqu'à ce que {0} soit étudié, {1} est deux fois plus susceptible de se reproduire. Nous dirions « pas de pression », mais ce serait un mensonge.",
  "{0} is over. Here's the homework.": '{0} est terminé. Voici les devoirs.',
  'The graphs have recovered and {0} is over.': 'Les graphiques ont récupéré et {0} est terminé.',
  "The postmortem came back with one action item: research {0}. Until that's done, this incident is twice as likely to happen. Your dashboards will see it coming. They just can't stop it.":
    "L’analyse post-incident est revenue avec une seule action : la recherche {0}. Tant que cela ne sera pas fait, cet incident aura deux fois plus de chances de se produire. Vos tableaux de bord le verront venir. Ils ne peuvent tout simplement pas l'arrêter.",
  'Resolved, with a note: {0}': 'Résolu, avec une note : {0}',
  'Marked as resolved: {0}.': 'Marqué comme résolu : {0}.',
  "We've attached the postmortem's one action item: research {0}.":
    "Nous avons joint la seule action de l'analyse post-incident : rechercher {0}.",
  "Regression risk: until {0} is researched, {1} is twice as likely. We'll be here to see it first.":
    "Risque de régression : jusqu'à ce que {0} soit recherché, {1} est deux fois plus probable. Nous serons là pour le voir en premier.",
  'Postmortem: {0}': 'Autopsie : {0}',
  'Blameless postmortem': 'Une analyse post-incident irréprochable',
  'What happened: {0}\nStatus: over\nRoot cause: nobody, as is tradition':
    "Ce qui s'est passé : {0}\nStatut : terminé\nCause fondamentale : personne, comme le veut la tradition",
  'Action items:\n1. Research {0}.': "Éléments d'action :\n1. Recherchez {0}.",
  "Until item 1 is done, {0} is twice as likely to happen. Please don't let it join the other action items in the backlog, where action items go to retire.":
    "Jusqu'à ce que l'élément 1 soit terminé, {0} est deux fois plus susceptible de se produire. S'il vous plaît, ne le laissez pas rejoindre les autres éléments d'action dans le backlog, où les éléments d'action seront retirés.",
  'Re: {0} — over, but': 'Re : {0} — terminé, mais',
  '{0} is over. Before you close the tab: the postmortem says research {1}.':
    "{0} est terminé. Avant de fermer l'onglet : l'analyse post-incident indique recherche {1}.",
  "It's not a suggestion. Until {0} is researched, {1} is twice as likely to come back. We'd rather not write you this email again, and we suspect you'd rather not read it.":
    "Ce n'est pas une suggestion. Jusqu'à ce que {0} soit étudié, {1} a deux fois plus de chances de revenir. Nous préférons ne plus vous écrire cet e-mail et nous soupçonnons que vous préférez ne pas le lire.",
  'Action needed: your Payments drawer is full':
    'Action nécessaire : votre tiroir de paiements est plein',
  'Your Payments drawer is full. New revenue has nowhere to go, so it is spilling over the edge instead of landing where you keep it.':
    'Votre tiroir de paiements est plein. Les nouveaux revenus n’ont nulle part où aller, ils débordent donc au lieu d’atterrir là où vous les gardez.',
  "Our fees, you'll be relieved to hear, are unaffected. Fees are subject to fees, and both are doing fine.":
    'Nos tarifs, vous serez soulagé de l’apprendre, ne sont pas affectés. Les frais sont soumis à des frais, et les deux se portent bien.',
  'Your funds are under review (and overflowing)':
    'Vos fonds sont en cours d’examen (et débordent)',
  "We've noticed unusual activity on your account: success. Your Payments drawer is full, and revenue is now spilling out of it.":
    'Nous avons remarqué une activité inhabituelle sur votre compte : succès. Votre tiroir de paiements est plein et des revenus en sortent désormais.',
  "We've reviewed this situation thoroughly and can confirm it is happening.":
    "Nous avons examiné cette situation en profondeur et pouvons confirmer qu'elle se produit.",
  'Regards,\nMerchant Services\n{0}': 'Cordialement,\nServices aux marchands\n{0}',
  'Payments drawer: full': 'Tiroir de paiement : plein',
  'Short one. The Payments drawer is full. Revenue that arrives now spills instead of being kept.':
    'Un court. Le tiroir Paiements est plein. Les revenus qui arrivent se déversent désormais au lieu d’être conservés.',
  "That's money you earned, falling on the floor. We thought you'd want to know.":
    "C'est l'argent que vous avez gagné et qui tombe par terre. Nous avons pensé que vous voudriez savoir.",
  '{0} Merchant Support': 'Assistance marchand {0}',
  'Re: Payments drawer — still full': 'Re : Tiroir de paiement toujours plein',
  'A reminder that your Payments drawer is full again, and revenue is spilling again.':
    'Un rappel que votre tiroir de paiements est à nouveau plein et que les revenus débordent à nouveau.',
  "We've sent this notice before. We'll send it again. We're very good at sending notices; payouts are the thing we're famous for doing slowly.":
    "Nous avons déjà envoyé cet avis. Nous l'enverrons à nouveau. Nous sommes très doués pour envoyer des avis ; les paiements sont la chose pour laquelle nous sommes réputés faire lentement.",
  'Your balance has nowhere to go': "Votre solde n'a nulle part où aller",
  "Here's a summary of your account today:": "Voici un résumé de votre compte aujourd'hui :",
  '- Payments drawer: full\n- New revenue: spilling\n- Your mood: we can guess':
    '- Tiroir de paiement : plein\n- Nouveaux revenus : déversement\n- Votre humeur : on devine',
  "Every sale from here on lands on the floor next to the drawer instead of in it. It's the nicest problem a business can have, right up until it isn't.":
    'Chaque vente à partir d’ici atterrit sur le sol à côté du tiroir au lieu de s’y trouver. C’est le plus beau problème qu’une entreprise puisse avoir, jusqu’à ce que ce ne soit plus le cas.',
  'Best,\nMerchant Success at {0}': 'Meilleur,\nSuccès du commerçant chez {0}',
  '[Action may be required] {0} restarted': '[Une action peut être requise] {0} redémarré',
  'We are contacting you because your resource {0} ran out of memory and was restarted.':
    'Nous vous contactons car votre ressource {0} manque de mémoire et a été redémarrée.',
  'Event type: OUT_OF_MEMORY_RESTART\nAffected resource: {0}\nStatus: Closed (restarted)':
    "Type d'événement : OUT_OF_MEMORY_RESTART\nRessource concernée : {0}\nStatut : Fermé (redémarré)",
  "If you have questions, our support team is available on a plan you don't have.":
    "Si vous avez des questions, notre équipe d'assistance est disponible sur un forfait que vous n'avez pas.",
  '{0} forgot everything': '{0} a tout oublié',
  "{0} filled its memory to the brim, tipped over, and restarted. It's back now with a clean slate and no memory of the incident, which is more than we can say for your logs.":
    "{0} a rempli sa mémoire à ras bord, a basculé et a redémarré. Il est de retour maintenant avec une table rase et aucun souvenir de l'incident, ce qui est plus que ce que nous pouvons dire d'après vos journaux.",
  'Out of memory: {0}': 'Mémoire insuffisante : {0}',
  'Instance: {0}\nEvent: out of memory\nResult: restarted':
    'Instance : {0}\nÉvénement : mémoire insuffisante\nRésultat : redémarré',
  '{0} used all of its RAM, so the process was killed and the node restarted. This notice is informational. So, in a way, was the restart.':
    '{0} a utilisé la totalité de son RAM, le processus a donc été arrêté et le nœud redémarré. Cet avis est informatif. D’une certaine manière, le redémarrage s’est déroulé ainsi.',
  '{0} Compute Notifications': '{0} Notifications de calcul',
  '{0} ran out of memory again': '{0} a de nouveau manqué de mémoire',
  '{0} has run out of memory again, and restarted again.':
    '{0} est à nouveau à court de mémoire et a redémarré.',
  "We've noticed a pattern. We're a cloud provider; noticing patterns and billing for them is most of what we do.":
    "Nous avons remarqué une tendance. Nous sommes un fournisseur de cloud ; remarquer les tendances et les facturer est l'essentiel de ce que nous faisons.",
  'Regards,\n{0} Health Dashboard': 'Cordialement,\nTableau de bord de santé {0}',
  "About {0}'s little nap": 'À propos de la petite sieste de {0}',
  'Dear customer,': 'Cher client,',
  'At approximately just now, {0} tried to use more memory than it had. Our systems responded the way systems do: the process was stopped and {1} restarted.':
    "À peu près tout à l'heure, {0} a essayé d'utiliser plus de mémoire qu'elle n'en avait. Nos systèmes ont réagi comme le font les systèmes : le processus a été arrêté et {1} redémarré.",
  "We'd like to reassure you that no hardware was harmed. Some requests may have been. We apologise for any inconvenience, and for this email.":
    "Nous tenons à vous rassurer qu'aucun matériel n'a été endommagé. Certaines demandes ont pu l’être. Nous nous excusons pour tout inconvénient et pour cet e-mail.",
  'Warm regards,\nCustomer Communications, {0}': 'Cordialement,\nCommunications client, {0}',
  '{0} is out of CPU credits': "{0} n'a plus de crédits CPU",
  'Your instance {0} has used all of its CPU credits. It is now throttled to 20% of its CPU.':
    'Votre instance {0} a utilisé tous ses crédits CPU. Il est désormais limité à 20 % de son CPU.',
  'Affected resource: {0}\nCurrent CPU limit: 20%':
    'Ressource concernée : {0}\nLimite actuelle du CPU : 20 %',
  'This is working as designed. Our design, not yours.':
    'Cela fonctionne comme prévu. Notre architecture, pas la vôtre.',
  '{0} is now running at 20%': '{0} fonctionne désormais à 20 %',
  "Good news: {0} is still running. Less good news: it's out of CPU credits, so it's throttled to 20%.":
    "Bonne nouvelle : {0} est toujours en cours d’exécution. Moins bonne nouvelle : il n'y a plus de crédits CPU, donc il est limité à 20 %.",
  'It can still do one fifth of a job. Like a meeting that could have been an email.':
    'Il peut encore faire un cinquième du travail. Comme une réunion qui aurait pu être un email.',
  'Your burst has been spent': 'Votre rafale a été dépensée',
  'BALANCE NOTICE': 'AVIS DE SOLDE',
  'Resource: {0}\nCPU credit balance: 0\nCPU available: 20%':
    'Ressource : {0}\nSolde créditeur CPU : 0\nCPU disponible : 20%',
  '{0} burst until the credits ran out. It is now throttled to 20%.':
    "{0} a éclaté jusqu'à épuisement des crédits. Il est désormais limité à 20 %.",
  'The credits were included in the price. The throttling is included too, at no extra charge.':
    'Les crédits étaient inclus dans le prix. La limitation est également incluse, sans frais supplémentaires.',
  '{0} Billing and Compute': '{0} Facturation et calcul',
  '{0} is throttled again': '{0} est à nouveau limité',
  '{0} is out of CPU credits again and back to running at 20%.':
    '{0} est à nouveau à court de crédits CPU et fonctionne à nouveau à 20 %.',
  'Some instances are built to sprint. Yours is built to sprint and then sit down for a long time.':
    'Certaines instances sont conçues pour sprinter. Le vôtre est conçu pour sprinter puis rester assis longtemps.',
  'Performance notice for {0}': 'Avis de performances pour {0}',
  'We are writing to let you know that {0} has run out of CPU credits. Its CPU is now throttled to 20%, so the work it does will take longer while this lasts.':
    "Nous vous écrivons pour vous informer que {0} n'a plus de crédits CPU. Son CPU est désormais limité à 20 %, le travail qu'il effectue prendra donc plus de temps tant que cela durera.",
  'This notice does not require a reply. Replies are not read. Neither, statistically, is this notice.':
    "Cet avis ne nécessite pas de réponse. Les réponses ne sont pas lues. Statistiquement, cet avis ne l'est pas non plus.",
  'ALARM: "{0}"': 'ALARME : "{0}"',
  'You are receiving this email because your alert rule "{0}" has entered the FIRING state.':
    'Vous recevez cet e-mail car votre règle d\'alerte "{0}" est entrée dans l\'état FIRING.',
  'Reason: threshold crossed and held for {0} seconds.\nState change: OK -> FIRING':
    "Raison : seuil franchi et maintenu pendant {0} secondes.\nChangement d'état : OK -> TIR",
  'View this alert on the dashboard you never close.':
    'Affichez cette alerte sur le tableau de bord que vous ne fermez jamais.',
  '[FIRING:1] {0}': '[TIR : 1] {0}',
  Firing: 'Tir',
  'Rule: {0}\nFor: {1}s\nSeverity: page': 'Règle : {0}\nPour : {1}s\nGravité : page',
  'This rule has been true for {0} seconds, which is long enough to count and too long to ignore.':
    "Cette règle s'applique aux secondes {0}, ce qui est suffisamment long pour être compté et trop long pour être ignoré.",
  'Your graph is doing something. That is not good.':
    "Votre graphique fait quelque chose. Ce n'est pas bon.",
  'Alert triggered: {0}': 'Alerte déclenchée : {0}',
  'One of your alert rules just fired:': "L'une de vos règles d'alerte vient d'être déclenchée :",
  "It held for {0} seconds before we said anything. We wanted to be sure. We're sure. We saw it first; now it's your turn.":
    "Cela a duré pendant {0} secondes avant que nous disions quoi que ce soit. Nous voulions en être sûrs. Nous en sommes sûrs. Nous l'avons vu en premier; maintenant c'est ton tour.",
  '[PAGE] {0} ({1}s)': '[PAGE] {0} ({1}s)',
  'You have been paged.': 'Vous avez été bipé.',
  'Alert: {0}\nDuration: {1} seconds\nUrgency: High':
    'Alerte : {0}\nDurée : {1} secondes\nUrgence : élevée',
  "The rule held for {0} seconds, so it's not a blip. Please look at it now, or at least look at it with an expression of concern.":
    "La règle a duré pendant {0} secondes, ce n'est donc pas un incident. S'il vous plaît, regardez-le maintenant, ou au moins regardez-le avec une expression d'inquiétude.",
  'Re: {0} — firing again': 'Re: {0} — tir à nouveau',
  '"{0}" is firing again. It held for {1} seconds this time.':
    '"{0}" tire à nouveau. Il a tenu pendant {1} secondes cette fois.',
  "We're not saying it's a pattern. We're just a graph of it, and the graph has an opinion.":
    "Nous ne disons pas que c'est une tendance. Nous n'en sommes qu'un graphique, et le graphique a une opinion.",
  'Nobody is listening to "{0}"': 'Personne n\'écoute "{0}"',
  'The rule "{0}" has cried wolf five times today. Your team has stopped listening to it.':
    'La règle "{0}" a crié au loup cinq fois aujourd\'hui. Votre équipe a arrêté de l\'écouter.',
  "That's reasonable, and also dangerous: the next real alarm from this rule will be ignored too.":
    "C'est raisonnable, et aussi dangereux : la prochaine véritable alarme issue de cette règle sera également ignorée.",
  'Fix: change its threshold, so it fires when something is actually wrong.':
    "Correctif : modifiez son seuil pour qu'il se déclenche lorsque quelque chose ne va pas.",
  'Alert fatigue report: "{0}"': 'Rapport d\'alerte fatigue : "{0}"',
  'ALERT HEALTH REPORT': 'ALERTE RAPPORT DE SANTÉ',
  'Rule: {0}\nFalse alarms today: 5\nPeople still paying attention: 0':
    "Règle : {0}\nFausses alarmes aujourd'hui : 5\nPersonnes toujours attentives : 0",
  'After five false alarms in one day, your team now ignores this rule. A rule nobody reads is a very expensive comment.':
    'Après cinq fausses alarmes en une journée, votre équipe ignore désormais cette règle. Une règle que personne ne lit est un commentaire très coûteux.',
  'Recommended: change its threshold.': 'Recommandé : modifier son seuil.',
  '"{0}" has become background noise': '"{0}" est devenu un bruit de fond',
  'Five false alarms today from "{0}". Your team has learned, quite sensibly, to ignore it.':
    'Cinq fausses alarmes aujourd\'hui provenant de "{0}". Votre équipe a appris, à bon escient, à l’ignorer.',
  "We'd love to say the rule will learn too. It won't. Rules don't learn. People do, and they just did.":
    "Nous aimerions dire que la règle apprendra aussi. Ce ne sera pas le cas. Les règles ne s'apprennent pas. Les gens le font, et ils viennent de le faire.",
  'Change its threshold and it can earn back their trust.':
    'Changez son seuil et il pourra regagner leur confiance.',
  'Ignored: {0}': 'Ignoré : {0}',
  'Five false alarms today. The team now ignores "{0}".':
    'Cinq fausses alertes aujourd\'hui. L\'équipe ignore désormais "{0}".',
  'We still see everything first. Now nobody sees it after us.':
    'Nous voyons toujours tout en premier. Maintenant, personne ne le voit après nous.',
  "Change the rule's threshold so it only fires when it means it.":
    "Modifiez le seuil de la règle pour qu'elle ne se déclenche que lorsque cela est nécessaire.",
  '"{0}" cried wolf again': '"{0}" a encore crié au loup',
  'You may remember this one. "{0}" went off five times today, every time for nothing, and the team ignores it again.':
    "Vous vous souvenez peut-être de celui-ci. \"{0}\" a explosé cinq fois aujourd'hui, à chaque fois pour rien, et l'équipe l'ignore encore une fois.",
  "We get it. Nobody wants to wake up for a graph that's fine. But the rule can't tell fine from on fire until you tell it.":
    "Nous comprenons. Personne ne veut se réveiller pour un graphique qui va bien. Mais la règle ne peut pas distinguer le feu d'un feu tant que vous ne le lui dites pas.",
  'Change its threshold.': 'Changez son seuil.',
  'Hello from the new engineer': 'Bonjour du nouvel ingénieur',
  "First day. I'm {0}, the new engineer. My laptop works, I've found the coffee, and I've already studied the whole architecture, which took four minutes because it's one Board.":
    "Premier jour. Je m'appelle {0}, le nouvel ingénieur. Mon ordinateur portable fonctionne, j'ai trouvé le café et j'ai déjà étudié toute l'architecture, ce qui a pris quatre minutes car c'est une seule carte.",
  'Excited to get going. Point me at something.': 'Hâte de commencer. Montre-moi quelque chose.',
  'Introducing myself: {0}': 'Je me présente : {0}',
  'Hello everyone,': 'Bonjour à tous,',
  "I'm {0}, and today is my first day on the team.":
    "Je m'appelle {0} et aujourd'hui c'est mon premier jour dans l'équipe.",
  'A bit about me:\n- I like systems that stay up\n- I like them more when they stay up at night\n- I have strong opinions about tabs and will keep them to myself for at least a week':
    "Un peu de moi :\n- J'aime les systèmes qui restent en place\n- Je les aime plus quand ils veillent la nuit\n- J'ai des opinions bien arrêtées sur les onglets et je les garderai pour moi pendant au moins une semaine",
  'Looking forward to working with you.': 'Au plaisir de travailler avec vous.',
  "hi! it's me": "salut ! c'est moi",
  "hey, it's {0}. first day!": "hé, c'est {0}. premier jour !",
  'just got access to everything, which feels like a lot of trust for someone you met in one interview':
    "je viens d'avoir accès à tout, ce qui ressemble à beaucoup de confiance pour quelqu'un que vous avez rencontré lors d'un entretien",
  'where should I start? happy to take whatever nobody else wants':
    "par où dois-je commencer ? heureux de prendre ce que personne d'autre ne veut",
  'Day one: reporting for duty': 'Premier jour : présentation au travail',
  'Reporting for duty. Badge: yes. Chair: yes. Context: absolutely none yet.':
    'Se présenter au travail. Insigne : oui. Président : oui. Contexte : absolument aucun pour l’instant.',
  "I'm told the best way to learn a system is to break it gently and fix it fast, so I'll be careful with the first part.":
    "On me dit que la meilleure façon d'apprendre un système est de le casser doucement et de le réparer rapidement, je ferai donc attention à la première partie.",
  'So glad to be here. Thanks for taking a chance on me.':
    "Je suis tellement content d'être ici. Merci d'avoir tenté ma chance.",
  'New engineer, first day, many questions':
    'Nouvel ingénieur, premier jour, beaucoup de questions',
  'Morning!': 'Bonjour !',
  "It's {0}. Officially on the team as of today.":
    "C'est {0}. Officiellement dans l'équipe à partir d'aujourd'hui.",
  'I have three questions and will probably have thirty by lunch:\n1. Who do I ask about the Database?\n2. Is there a runbook?\n3. Is "there\'s no runbook" the runbook?':
    "J'ai trois questions et j'en aurai probablement trente d'ici le déjeuner :\n1. À qui dois-je m'adresser à propos de la base de données ?\n2. Existe-t-il un runbook ?\n3. Est-ce que « il n'y a pas de runbook » est le runbook ?",
  "Very happy to be here. Let's build something that stays up.":
    "Très heureux d'être ici. Construisons quelque chose qui reste en place.",
  'Done: {0}': 'Terminé : {0}',
  '{0} is done. Finished it just now.': '{0} est terminé. Je viens de le terminer.',
  "No drama, no surprises, which in this job counts as a celebration. Tests were green; I checked twice because I didn't believe it.":
    "Pas de drame, pas de surprises, ce qui dans ce métier compte comme une fête. Les tests étaient au vert ; J'ai vérifié deux fois parce que je n'y croyais pas.",
  "What's next?": 'Quelle est la prochaine étape ?',
  'Wrapped up {0}': 'Emballé {0}',
  "Quick update: I've finished {0}.": "Mise à jour rapide : j'ai terminé {0}.",
  "It took the usual path: it looked easy, then it looked impossible, then it looked done. I'm going with done.":
    "Cela a pris le chemin habituel : cela semblait facile, puis cela semblait impossible, puis cela semblait terminé. J'y vais avec terminé.",
  "If you've got the next thing lined up, I'm ready. If not, I'll go read the logs for fun.":
    "Si vous avez la prochaine chose en vue, je suis prêt. Sinon, j'irai lire les logs pour m'amuser.",
  '{0} is finished': '{0} est terminé',
  'ok, {0} is finished!': 'ok, {0} est terminé !',
  "honestly I thought it'd take longer. either I'm getting faster or I missed something. I'm choosing to believe the first one":
    "honnêtement, je pensais que ça prendrait plus de temps. soit je vais plus vite, soit j'ai raté quelque chose. Je choisis de croire le premier",
  'ready for the next task whenever you are': "prêt pour la prochaine tâche quand vous l'êtes",
  'Another one done: {0}': 'Un autre réalisé : {0}',
  'Another one off the list: {0} is finished.': 'Un autre hors de la liste : {0} est terminé.',
  "I'm starting to enjoy this. Don't tell anyone, it ruins the mystique.":
    'Je commence à apprécier ça. Ne le dites à personne, cela ruine le mystère.',
  'Anything you want me to pick up next?': 'Quelque chose que tu veux que je reprenne ensuite ?',
  'Thanks,\n{0}': 'Merci,\n{0}',
  'Status update: {0}': 'Mise à jour du statut : {0}',
  "Status update, since I promised I'd write these:":
    "Mise à jour du statut, puisque j'ai promis d'écrire ceci :",
  'Task: {0}\nStatus: finished\nBlockers: none\nCoffee: one too many':
    'Tâche : {0}\nStatut : terminé\nBloqueurs : aucun\nCafé : un de trop',
  "It's ready whenever you want it. I'll take whatever's next on the list.":
    "C'est prêt quand vous le voulez. Je prendrai ce qui suit sur la liste.",
  'Shipped it': "Je l'ai expédié",
  "Just deployed {0}. It's live.": "Je viens de déployer {0}. C'est en direct.",
  "Dashboards look calm. I'm going to keep staring at them for the next twenty minutes anyway, just in case calm is lying.":
    'Les tableaux de bord semblent calmes. Je vais de toute façon continuer à les regarder pendant les vingt prochaines minutes, juste au cas où le calme mentirait.',
  "Deploy notes: it's out": "Notes de déploiement : c'est terminé",
  'Hi all,': 'Salut à tous,',
  'Deploy notes, short version:': 'Notes de déploiement, version courte :',
  'Shipped: {0}\nRollback needed: no\nFridays involved: no':
    'Expédié : {0}\nRestauration nécessaire : non\nVendredi concerné : non',
  "It went smoother than my last three deploys combined. I'm not going to question it.":
    'Cela s’est déroulé plus facilement que mes trois derniers déploiements combinés. Je ne vais pas le remettre en question.',
  "it's live!!": "c'est en direct !!",
  '{0}, out in the world. users can poke at it right now':
    '{0}, dans le monde. les utilisateurs peuvent y accéder dès maintenant',
  "I did the thing where you refresh the page after deploying like it'll change something. it didn't. that's good":
    "J'ai fait la chose où vous actualisez la page après le déploiement comme si cela changerait quelque chose. ce n'est pas le cas. c'est bien",
  'Deployed another one': "J'en ai déployé un autre",
  'Another deploy out the door: {0}.': 'Un autre déploiement à la porte : {0}.',
  'Each time it gets a little less scary. This time I only held my breath for part of it.':
    'À chaque fois, cela devient un peu moins effrayant. Cette fois, je n’ai retenu ma respiration que pendant une partie.',
  'Let me know if users say anything nice. Or anything at all.':
    "Faites-moi savoir si les utilisateurs disent quelque chose de gentil. Ou n'importe quoi du tout.",
  'Release complete': 'Sortie terminée',
  'Happy to report the release is complete. This went out today:':
    "Heureux d'annoncer que la sortie est terminée. C'est sorti aujourd'hui :",
  "Everything is running and I haven't seen an error yet. I'll keep an eye on it through the afternoon.":
    "Tout fonctionne et je n'ai pas encore vu d'erreur. Je vais le surveiller tout au long de l'après-midi.",
  'Thanks to whoever reviewed it, including the person who said "looks good" without reading it. You know who you are.':
    'Merci à celui qui l\'a relu, y compris à la personne qui a dit "ça a l\'air bien" sans le lire. Vous savez qui vous êtes.',
  'I broke it': "je l'ai cassé",
  "I deployed {0} and there's a bug in it. The App Servers are crashing.":
    "J'ai déployé {0} et il y a un bug. Les serveurs applicatifs plantent.",
  "That's on me. I'm sorry. I'm looking at it right now. Please don't refresh the dashboard, it only makes it worse for both of us.":
    "C'est pour moi. Je suis désolé. Je le regarde en ce moment. S'il vous plaît, n'actualisez pas le tableau de bord, cela ne fait qu'empirer les choses pour nous deux.",
  'Bad deploy: App Servers crashing': 'Mauvais déploiement : les serveurs applicatifs plantent',
  'Bad news first, then more bad news: {0} shipped with a bug, and the App Servers are crashing because of it.':
    "Mauvaise nouvelle d'abord, puis encore de mauvaises nouvelles : {0} est livré avec un bug et les serveurs applicatifs plantent à cause de cela.",
  'Tests passed. Review passed. Production did not pass.':
    "Tests réussis. Examen réussi. La production n'a pas réussi.",
  "I'm digging in now. Will write again when I know more.":
    "Je creuse maintenant. J'écrirai à nouveau quand j'en saurai plus.",
  'uh oh': 'euh oh',
  'the {0} deploy had a bug in it. App Servers are crashing':
    'le déploiement {0} contenait un bug. Les serveurs applicatifs plantent',
  "it worked on my machine. my machine is not where the users are, I'm realising":
    "cela a fonctionné sur ma machine. ma machine n'est pas là où se trouvent les utilisateurs, je me rends compte",
  'sorry. on it': 'désolé. dessus',
  'It happened again': "C'est encore arrivé",
  "I'm sorry to write this kind of email twice. The deploy of {0} has a bug, and the App Servers are crashing again.":
    "Je suis désolé d'écrire ce genre d'e-mail deux fois. Le déploiement de {0} présente un bug et les serveurs applicatifs plantent à nouveau.",
  'I know. I\'m adding "check it more carefully" to my list of things I already thought I was doing.':
    'Je sais. J\'ajoute "vérifiez-le plus attentivement" à ma liste de choses que je pensais déjà faire.',
  'Looking into it now.': "J'y réfléchis maintenant.",
  'Incident: my deploy is crashing App Servers':
    'Incident : mon déploiement fait planter les serveurs applicatifs',
  'Writing this before anyone has to ask.': 'Écrivez ceci avant que quiconque ait à le demander.',
  'What: I deployed {0}\nProblem: it has a bug\nImpact: App Servers are crashing\nWhose fault: mine, blameless postmortem notwithstanding':
    "Quoi : J'ai déployé {0}\nProblème : il y a un bug\nImpact : les serveurs applicatifs plantent\nÀ qui la faute : la mienne, malgré une analyse post-incident irréprochable",
  "I'm on it, and I'll stay on it until it's fixed.":
    "J'y suis et j'y resterai jusqu'à ce que le problème soit réparé.",
  'Migration progress: {0} on the new Stack':
    'Avancement de la migration : {0} sur la nouvelle Stack',
  'Migration update: {0} of your App Servers now run on the new Stack.':
    "Mise à jour de migration : {0} de vos serveurs applicatifs s'exécutent désormais sur la nouvelle Stack.",
  'No incident to report, which is why this email is so short and why nobody woke you up for it.':
    "Aucun incident à signaler, c'est pourquoi cet email est si court et pourquoi personne ne vous a réveillé.",
  '{0} of App Servers moved': '{0} des serveurs applicatifs déplacés',
  'The new Stack line is going up and to the right, the good way for once: {0} of App Servers have moved over.':
    'La nouvelle ligne Stack monte et vers la droite, dans le bon sens pour une fois : {0} des serveurs applicatifs ont déménagé.',
  'Two lines share the panel now, old Stack and new. Pick a favourite. We already know which one is going to win.':
    "Deux lignes partagent désormais le panneau, l'ancienne Stack et la nouvelle. Choisissez un favori. Nous savons déjà lequel va gagner.",
  'Release tracking: new Stack at {0}': 'Suivi des versions : nouvelle pile sur {0}',
  "We're tracking the move: {0} of your App Servers now run on the new Stack.":
    "Nous suivons le mouvement : {0} de vos serveurs applicatifs s'exécute désormais sur la nouvelle Stack.",
  "We'll be watching for anything new it brings with it. We always do. It's the only thing we do.":
    "Nous surveillerons tout ce que cela apportera de nouveau. Nous le faisons toujours. C'est la seule chose que nous faisons.",
  'Re: migration — now {0}': 'Re : migration — maintenant {0}',
  'The migration keeps moving. {0} of App Servers are on the new Stack now.':
    'La migration continue. {0} des serveurs applicatifs sont désormais sur la nouvelle pile.',
  "Every migration has a long middle where both Stacks are running and nobody can quite remember why the old one existed. You're in it.":
    "Chaque migration comporte un long milieu où les deux piles s'exécutent et personne ne se souvient vraiment de la raison pour laquelle l'ancienne existait. Vous êtes dedans.",
  'Status: Stack migration at {0}': 'Statut : Migration de pile sur {0}',
  'MIGRATION STATUS': 'STATUT MIGRATOIRE',
  'App Servers on the new Stack: {0}\nApp Servers on the old Stack: the rest\nPages sent about this: 0':
    "Serveurs d'applications sur la nouvelle pile : {0}\nServeurs d'applications sur l'ancienne Stack : le reste\nPages envoyées à ce sujet : 0",
  'This notice is informational. Nothing is on fire. We checked twice, because it felt unusual.':
    "Cet avis est informatif. Rien n'est en feu. Nous avons vérifié deux fois, car cela nous semblait inhabituel.",
  'no-reply@awol.cloud': 'no-reply@awol.cloud',
  'alarm@pagerdooty.io': 'alarme@pagerdooty.io',
  'billing@swipe.dev': 'facturation@swipe.dev',
  'We swipe the card. Then we swipe a little more.':
    'Nous glissons la carte. Ensuite, on glisse un peu plus.',
  'deals@roadrunner.vc': 'offres@roadrunner.vc',
  'Beep beep, and congrats on the traction.': 'Bip bip, et félicitations pour la traction.',
  'books@quickbroke.app': 'livres@quickbroke.app',
  'Reconciled to the nearest regret.': 'Réconcilié au regret le plus proche.',
  'tickets@zenfail.help': 'tickets@zenfail.help',
  'Ticket #4,096. We take your feedback seriously.':
    'Billet n° 4 096. Nous prenons vos commentaires au sérieux.',
  'leslie@lamport.clock': 'leslie@lamport.clock',
  'Sent at an unspecified time, in an unspecified order.':
    'Envoyé à une heure indéterminée, dans un ordre indéterminé.',
  'digest@cve.fyi': 'digest@cve.fyi',
  'Unsubscribe by patching.': 'Désabonnez-vous en appliquant un correctif.',
  'noreply@gooble.cloud': 'noreply@gooble.cloud',
  'We will sunset this feature in 6 to 8 weeks.':
    'Nous supprimerons cette fonctionnalité dans 6 à 8 semaines.',
  'alerts@azzure.cloud': 'alertes@azzure.cloud',
  'Now in 400 regions, 3 of them up.': 'Maintenant dans 400 régions, dont 3 en hausse.',
  'noreply@cloudscare.net': 'noreply@cloudscare.net',
  'Verifying you are human. We have our doubts.':
    'Vérifier que vous êtes humain. Nous avons nos doutes.',
  'alerts@grafauna.dev': 'alertes@grafauna.dev',
  'Your graph has gone flat. That is not good.':
    "Votre graphique est devenu plat. Ce n'est pas bon.",
  'issues@centry.io': 'issues@centry.io',
  'Every event counts. Every event is billed.':
    'Chaque événement compte. Chaque événement est facturé.',
  'service@paypaul.com': 'service@paypaul.com',
  'Your funds are under review. Forever.': "Vos fonds sont en cours d'examen. Pour toujours.",
  'partners@sequel.vc': 'partenaires@sequel.vc',
  'Every round deserves a sequel.': 'Chaque tour mérite une suite.',
  'apply@whycombinator.vc': 'appliquer@pourquoicombinator.vc',
  'Why not.': 'Pourquoi pas.',
  'books@zero.accountant': 'livres@zero.accountant',
  'Your balance, rounded to the nearest zero.': 'Votre solde, arrondi au zéro le plus proche.',
  'chat@intercomatose.help': 'chat@intercomatose.help',
  'Typically replies in a few business decades.':
    'Répond généralement dans quelques décennies commerciales.',
  'edsger@shortest.path': 'edsger@shortest.path',
  'GOTO statements considered harmful, as are your SLOs.':
    'Les déclarations GOTO sont considérées comme nuisibles, tout comme vos SLO.',
  'grace@nanosecond.wire': 'grace@nanosecond.wire',
  'Sent in the time it takes light to travel one foot.':
    "Envoyé dans le temps qu'il faut à la lumière pour parcourir un pied.",
  'bulletins@nvdumpster.org': 'bulletins@nvdumpster.org',
  'Every advisory is critical until proven otherwise.':
    'Chaque avis est critique jusqu’à preuve du contraire.',
  'sales@datadug-observe.biz': 'sales@datadug-observe.biz',
  'Dashboards so deep you will never leave.':
    'Des tableaux de bord si profonds que vous ne les quitterez jamais.',
  'ae@slowflake.cloud': 'ae@slowflake.cloud',
  'Per-second billing, per-minute regret.': 'Facturation à la seconde, regret à la minute.',
  'hello@devnull.wtf': 'bonjour@devnull.wtf',
  'Fast. Durable. Webscale.': 'Rapide. Durable. Échelle Web.',
  'billing@awol-cloud.support': 'facturation@awol-cloud.support',
  'Do not ignore this notice.': "N'ignorez pas cet avis.",
  'digest@cve-fyi.top': 'digest@cve-fyi.top',
  'Act now.': 'Agissez maintenant.',
  'chad@talentbro.hr': 'chad@talentbro.hr',
  'Let us circle back on your circle back.': 'Revenons sur votre cercle.',
  'billing@azzure-invoices.top': 'billing@azzure-invoices.top',
  'Pay within 24 hours to avoid service interruption.':
    'Payez dans les 24 heures pour éviter une interruption de service.',
  'renewals@domain-guard.wtf': 'renouvellements@domain-guard.wtf',
  'We are not your registrar, but we could be.':
    "Nous ne sommes pas votre registraire, mais nous pourrions l'être.",
  'sponsors@webscale.events': 'sponsors@webscale.events',
  'Where thought leaders lead thoughts.': 'Où les leaders d’opinion mènent leurs réflexions.',
  'hi@incohere.ai': 'salut@incohere.ai',
  'Confidently wrong, at scale.': "En toute confiance, c'est faux, à grande échelle.",
  "'); DROP TABLE signatures;--": "'); Signatures DROP TABLE ;--",
  'Sent twice, or not at all.': 'Envoyé deux fois, voire pas du tout.',
  'Signature: undefined': 'Signature : non définie',
  'Sent with elevated privileges.': 'Envoyé avec des privilèges élevés.',
  'Sent from pod 3 of 3. Pods 1 and 2 are pending.':
    'Envoyé depuis le pod 3 sur 3. Les pods 1 et 2 sont en attente.',
  'Core dumped.': 'Noyau vidé.',
  'Sent while holding the lock. Please reply quickly.':
    'Envoyé en tenant le cadenas. Merci de répondre rapidement.',
  'Sent from a breakpoint.': "Envoyé depuis un point d'arrêt.",
  'Quick question about your dashboards': 'Petite question sur vos tableaux de bord',
  'I noticed your team is shipping fast. Love that energy.':
    "J'ai remarqué que votre équipe expédie rapidement. J'adore cette énergie.",
  'Quick question: how many dashboards do you have right now? Most founders say "two, maybe." Our customers average 1,140, and 1,138 of them have never been opened. That\'s what we call observability maturity.':
    "Petite question : de combien de tableaux de bord disposez-vous actuellement ? La plupart des fondateurs disent « deux, peut-être ». Nos clients sont en moyenne 1 140, et 1 138 d’entre eux n’ont jamais été ouverts. C'est ce que nous appelons la maturité de l'observabilité.",
  '{0} ingests every log, metric, trace, and vibe your stack emits, and keeps it forever. Leaving is technically possible, in the way that leaving a cave system is technically possible.':
    '{0} ingère chaque journal, métrique, trace et vibration émis par votre pile et les conserve pour toujours. Quitter est techniquement possible, de la même manière que quitter un système de grottes est techniquement possible.',
  'Worth a 15-minute chat this week?':
    'Cela vaut-il la peine de discuter pendant 15 minutes cette semaine ?',
  'Best,\nTyler\nAccount Executive, {0}': 'Meilleur,\nTyler\nChargé de compte, {0}',
  'Re: Quick question about your dashboards': 'Re : Petite question sur vos tableaux de bord',
  "Just bumping this to the top of your inbox in case it got buried. (If you had {0}, you'd have a dashboard showing exactly how buried.)":
    'Il suffit de placer ceci en haut de votre boîte de réception au cas où il serait enterré. (Si vous aviez {0}, vous auriez un tableau de bord indiquant exactement à quel point il est enterré.)',
  'Happy to do Tuesday or Thursday.': 'Heureux de le faire mardi ou jeudi.',
  Tyler: 'Tyler',
  'Your free trial is a forever trial*': 'Votre essai gratuit est un essai permanent*',
  'Good news!': 'Bonne nouvelle !',
  'Your team is eligible for a 14-day free trial of {0} Enterprise.':
    'Votre équipe est éligible à un essai gratuit de 14 jours de {0} Enterprise.',
  "What's included:\n- Unlimited dashboards\n- Unlimited alerts about your dashboards\n- A dashboard of your alerts about your dashboards\n- Custom metrics, billed per custom metric, per host, per hour, per feeling":
    'Ce qui est inclus :\n- Tableaux de bord illimités\n- Alertes illimitées sur vos tableaux de bord\n- Un tableau de bord de vos alertes sur vos tableaux de bord\n- Métriques personnalisées, facturées par métrique personnalisée, par hôte, par heure, par sensation',
  '*After 14 days, your data stays with us. You can export it any time by talking to Sales.':
    "*Après 14 jours, vos données restent chez nous. Vous pouvez l'exporter à tout moment en contactant le service commercial.",
  'Start your trial in one click!': 'Démarrez votre essai en un clic !',
  'The {0} Growth Team': "L'équipe de croissance {0}",
  'Saw your bill and thought of you': "J'ai vu ta facture et j'ai pensé à toi",
  'Hey!': 'Hé!',
  'One of our customers just told me their {0} invoice is now larger than their cloud bill, their payroll, and their rent combined. They called it "a wake-up call." We called it "a case study."':
    'Un de nos clients vient de me dire que sa facture {0} est désormais supérieure à sa facture cloud, sa masse salariale et son loyer réunis. Ils ont appelé cela « un signal d’alarme ». Nous avons appelé cela « une étude de cas ».',
  'The thing is, they can now see that their costs are up 400% on a beautiful stacked area chart, in real time. Could your team say the same?':
    'Le fait est qu’ils peuvent désormais constater que leurs coûts ont augmenté de 400 % sur un magnifique graphique à aires empilées, en temps réel. Votre équipe pourrait-elle en dire autant ?',
  "I've put 30 minutes on your calendar. Feel free to move it, but not to cancel it.":
    "J'ai mis 30 minutes sur votre calendrier. N'hésitez pas à le déplacer, mais pas à l'annuler.",
  'Cheers,\nTyler': 'Bravo,\nTyler',
  'Should I close your file?': 'Dois-je fermer votre dossier ?',
  "I've reached out a few times and haven't heard back, so I'll assume one of three things:":
    "J'ai contacté plusieurs fois et je n'ai pas eu de réponse, je suppose donc l'une des trois choses suivantes :",
  "1. You're happy flying blind.\n2. You're buried in an incident you can't see.\n3. You've been dug in by a competitor and can't get out. Blink twice.":
    "1. Vous êtes heureux de voler à l'aveugle.\n2. Vous êtes enterré dans un incident que vous ne pouvez pas voir.\n3. Vous avez été retranché par un concurrent et vous ne parvenez pas à en sortir. Clignez des yeux deux fois.",
  'Either way, this is my last email. Probably. Our sequence software has opinions.':
    "Quoi qu'il en soit, c'est mon dernier e-mail. Probablement. Notre logiciel de séquencement a des avis.",
  'All the best,\nTyler from {0}': 'Tout le meilleur,\nTyler de {0}',
  'Is your 4 GB database ready for petabyte scale?':
    'Votre base de données de 4 Go est-elle prête à évoluer en pétaoctets ?',
  'Our data team ran a quick scan and estimates your database at about 4 GB. Big things start small!':
    'Notre équipe de données a effectué une analyse rapide et estime votre base de données à environ 4 Go. Les grandes choses commencent petites !',
  "With {0}, those 4 GB can be split across a 64-node warehouse, a 128-node warehouse, and a third warehouse that monitors the first two. Queries that took 9 milliseconds on your laptop now take 40 seconds on our cloud, which proves they're doing serious work.":
    "Avec {0}, ces 4 Go peuvent être répartis entre un entrepôt de 64 nœuds, un entrepôt de 128 nœuds et un troisième entrepôt qui surveille les deux premiers. Les requêtes qui prenaient 9 millisecondes sur votre ordinateur portable prennent désormais 40 secondes sur notre cloud, ce qui prouve qu'ils font un travail sérieux.",
  "Per-second billing means you only pay for what you use. You'll use a lot.":
    'La facturation à la seconde signifie que vous ne payez que ce que vous utilisez. Vous en utiliserez beaucoup.',
  'Can I send over a deck?': 'Puis-je envoyer un deck ?',
  'Warmly,\nMadison, Enterprise Data Evangelist':
    "Chaleureusement,\nMadison, évangéliste des données d'entreprise",
  'Re: petabyte scale': 'Re : échelle du pétaoctet',
  "Circling back here. I know 4 GB feels manageable today. That's what they all say, right before someone runs SELECT * on a Friday and the auto-scaler wakes up.":
    "Je reviens ici. Je sais que 4 Go semblent gérables aujourd’hui. C'est ce qu'ils disent tous, juste avant que quelqu'un n'exécute SELECT * un vendredi et que l'autoscaler ne se réveille.",
  'The {0} team would love to help you be ready for that moment, and then send you an itemized summary of it.':
    "L'équipe {0} se fera un plaisir de vous aider à être prêt pour ce moment, puis de vous en envoyer un résumé détaillé.",
  Madison: 'Madison',
  'Your credit forecast is in': 'Votre prévision de crédit est disponible',
  'CREDIT FORECAST: FREE-TIER PROSPECT': 'PRÉVISIONS DE CRÉDIT : PERSPECTIVE DE NIVEAU GRATUIT',
  'Estimated monthly credits: 3\nEstimated monthly credits after one curious analyst: 41,000\nEstimated monthly credits after one dashboard set to refresh every minute: yes':
    "Crédits mensuels estimés : 3\nCrédits mensuels estimés d'après un analyste curieux : 41 000\nCrédits mensuels estimés après un tableau de bord configuré pour s'actualiser toutes les minutes : oui",
  'Recommended plan: Enterprise Plus Platinum Snow':
    'Forfait recommandé : Enterprise Plus Platinum Snow',
  '{0} warehouses auto-suspend after 10 minutes idle. Dashboards are never idle.':
    "Les entrepôts {0} se suspendent automatiquement après 10 minutes d'inactivité. Les tableaux de bord ne sont jamais inactifs.",
  'To discuss your forecast, reply to this email. Replies are free.':
    'Pour discuter de vos prévisions, répondez à cet e-mail. Les réponses sont gratuites.',
  "A customer story you'll relate to": 'Une histoire client à laquelle vous vous identifierez',
  'I wanted to share a quick story. A startup about your size moved their 4 GB of orders to {0}. Within a month, their analysts were asking questions they had never thought to ask, such as "who approved this?" and "how is it per second?"':
    'Je voulais partager une histoire rapide. Une startup de votre taille a déplacé ses 4 Go de commandes vers {0}. En un mois, leurs analystes posaient des questions qu\'ils n\'avaient jamais pensé poser, telles que « qui a approuvé cela ? et "comment ça se passe par seconde ?"',
  'Today they run a lean, data-driven culture. Mostly lean.':
    'Aujourd’hui, ils gèrent une culture allégée et axée sur les données. Surtout maigre.',
  'They asked to remain anonymous, and also asked us to stop calling.':
    "Ils ont demandé à rester anonymes et nous ont également demandé de cesser d'appeler.",
  'Would you be open to a 20-minute discovery session?':
    'Seriez-vous ouvert à une séance découverte de 20 minutes ?',
  'Best regards,\nMadison': 'Cordialement,\nMadison',
  'Data Pillow Summit: free tickets for founders':
    'Data Pillow Summit : billets gratuits pour les fondateurs',
  "You're invited to the {0} Summit, where 12,000 engineers gather in one hall to learn how to put a pillow on top of a lake.":
    "Vous êtes invité au sommet {0}, où 12 000 ingénieurs se réunissent dans une salle pour apprendre à poser un oreiller au-dessus d'un lac.",
  'Highlights:\n- Keynote: "Zero-Copy Cloning, Infinite-Copy Invoices"\n- Workshop: Rightsizing your 4 GB for the cloud era\n- Panel: Per-second billing, per-minute regret':
    'Points forts :\n- Keynote : "Clonage sans copie, factures à copie infinie"\n- Atelier : Redimensionner vos 4 Go pour l\'ère du cloud\n- Panel : facturation à la seconde, regret à la minute',
  'Your ticket is free. Lunch is consumption-based.':
    'Votre billet est gratuit. Le déjeuner est basé sur la consommation.',
  'See you there,\nThe {0} Events Team': "On se voit là-bas,\nL'équipe événementielle {0}",
  'Writes in 0 ms. Guaranteed.': 'Écrit en 0 ms. Garanti.',
  'Tired of slow writes? {0} accepts every write you send it in zero milliseconds, at any scale, forever.':
    "Fatigué des écritures lentes ? {0} accepte chaque écriture que vous lui envoyez en zéro milliseconde, à n'importe quelle échelle, pour toujours.",
  'How? We have reinvented durability from first principles and found it was optional.':
    "Comment ? Nous avons réinventé la durabilité à partir des principes premiers et avons trouvé qu'elle était facultative.",
  'Our benchmarks:\n- Throughput: unlimited\n- p99 latency: 0 ms\n- Data loss: within expected parameters':
    'Nos repères :\n- Débit : illimité\n- Latence p99 : 0 ms\n- Perte de données : dans les paramètres attendus',
  "It's fast. It's durable. It's webscale.":
    "C'est rapide. C'est résistant. C'est à l'échelle du Web.",
  'Shall we set up a proof of concept? It will finish instantly.':
    'Devons-nous mettre en place une preuve de concept ? Cela se terminera instantanément.',
  'Re: Writes in 0 ms': 'Re : Écrit en 0 ms',
  'Just floating this back up. A few founders have asked whether {0} supports reads.':
    'Je fais juste remonter ça. Quelques fondateurs ont demandé si {0} prenait en charge les lectures.',
  "Great question! Reads are available on our Enterprise tier, priced per read, with a minimum commitment of three years. Our Sales Engineering team will be happy to explain what you'll be reading.":
    'Excellente question ! Les lectures sont disponibles sur notre niveau Entreprise, au prix par lecture, avec un engagement minimum de trois ans. Notre équipe d’ingénierie commerciale se fera un plaisir de vous expliquer ce que vous allez lire.',
  'Talk soon,\nDerek\nSolutions Architect': 'Parlez bientôt,\nDerek\nArchitecte de solutions',
  'Is your database web scale?': 'Votre base de données est-elle à l’échelle du Web ?',
  'Your database uses transactions. Locks. Indexes. A write-ahead log. Do you know what has none of those things? {0}.':
    "Votre base de données utilise des transactions. Serrures. Index. Un journal à écriture anticipée. Savez-vous ce qui n'a rien de tout cela ? {0}.",
  "We don't do joins, because joins don't scale. We don't do schemas, because schemas don't scale. We don't keep data, because, if we're honest, data doesn't scale.":
    'Nous ne faisons pas de jointures, car les jointures ne sont pas évolutives. Nous ne faisons pas de schémas, car les schémas ne sont pas évolutifs. Nous ne conservons pas de données car, si nous sommes honnêtes, les données ne sont pas évolutives.',
  "We shard to /dev/null, then shard that shard. It's /dev/null all the way down.":
    "Nous partageons vers /dev/null, puis partageons ce fragment. C'est /dev/null jusqu'au bout.",
  "Migrate today. There's nothing to migrate back.": "Migrez aujourd’hui. Il n'y a rien à migrer.",
  Derek: 'Derek',
  '{0} is now SOC 2 compliant': '{0} est désormais conforme à SOC 2',
  ANNOUNCEMENT: 'ANNONCE',
  "We're proud to share that {0} has completed its SOC 2 audit with zero findings.":
    "Nous sommes fiers d'annoncer que {0} a terminé son audit SOC 2 sans aucun résultat.",
  'The auditors could not locate any customer data, so none of it could be mishandled. They described our retention policy as "immediate" and our access controls as "moot".':
    "Les auditeurs n’ont pu localiser aucune donnée client, donc aucune d’entre elles n’a pu être mal gérée. Ils ont décrit notre politique de rétention comme « immédiate » et nos contrôles d'accès comme « sans objet ».",
  'Your data has never been safer. Your data has never been anywhere.':
    "Vos données n'ont jamais été aussi sécurisées. Vos données n’ont jamais été nulle part.",
  "Book a security review with our team. Bring nothing; you'll leave with nothing.":
    "Réservez un examen de sécurité avec notre équipe. N'apportez rien ; tu repartiras sans rien.",
  "We're sunsetting the free tier (sort of)": "Nous supprimons l'offre gratuite (en quelque sorte)",
  'A quick note on pricing. Starting next month, the {0} free tier will continue to accept unlimited writes at no cost. Nothing changes there.':
    'Un petit mot sur les prix. À partir du mois prochain, le niveau gratuit {0} continuera d’accepter un nombre illimité d’écritures sans frais. Rien ne change là-bas.',
  'What does change: our backups product, previously "not available," will now be "coming soon." Our restore product will remain a frequently requested feature.':
    'Ce qui change : notre produit de sauvegarde, auparavant « non disponible », sera désormais « bientôt disponible ». Notre produit de restauration restera une fonctionnalité fréquemment demandée.',
  "Thanks for being a valued source of bytes. We've enjoyed every one of them, briefly.":
    "Merci d'être une source précieuse d'octets. Nous avons apprécié chacun d’entre eux, brièvement.",
  'Warmly,\nDerek and the team': "Chaleureusement,\nDerek et l'équipe",
  'Rockstar opportunity for your engineers 🚀': 'Opportunité Rockstar pour vos ingénieurs 🚀',
  'Hey!!': 'Hé !!',
  "Chad here from {0}. I came across your engineering team and I'll be honest, I was blown away. Real rockstars. Total ninjas.":
    "Tchad ici de {0}. Je suis tombé sur votre équipe d'ingénieurs et je vais être honnête, j'ai été époustouflé. De vraies rockstars. Des ninjas en totalité.",
  "My client is a stealth-mode, pre-revenue, post-product startup offering:\n- Unlimited PTO (please don't take it)\n- Beanbags\n- A kombucha tap that works on Tuesdays\n- Equity in a company that will definitely exist":
    'Mon client est une offre de startup en mode furtif, avant revenus et post-produit :\n- Prise de force illimitée (veuillez ne pas la prendre)\n- Poufs\n- Un robinet de kombucha qui fonctionne le mardi\n- Fonds propres dans une entreprise qui existera définitivement',
  "Could you forward this to your strongest backend person? I can't seem to find their contact info, which is weird because I found yours.":
    "Pourriez-vous transmettre ceci à votre personne back-end la plus compétente ? Je n'arrive pas à trouver leurs coordonnées, ce qui est bizarre car j'ai trouvé les vôtres.",
  'Cheers bro,\nChad': 'Bravo mon frère,\nTchad',
  'Re: Rockstar opportunity': 'Re : Opportunité Rockstar',
  'Hey, just bumping this!': 'Hé, je viens de cogner ça !',
  "Did you get a chance to forward to your team? No worries if not. Let's circle back on your circle back, then touch base on the circle.":
    "Avez-vous eu l'occasion de transmettre à votre équipe ? Pas de soucis sinon. Revenons sur votre cercle, puis touchons la base du cercle.",
  'Chad\n{0}': 'Tchad\n{0}',
  'Is your Database person happy?': 'Votre responsable de la base de données est-il satisfait ?',
  'Weird question, but how happy is your database engineer, on a scale of 1 to "updating their profile at 2 a.m."?':
    'Question étrange, mais dans quelle mesure votre ingénieur de base de données est-il satisfait, sur une échelle de 1 à « mettre à jour son profil à 2 heures du matin » ?',
  "I only ask because I have a role that's perfect for them. Fully remote, fully on-site, or fully hybrid, depending on the day. Salary is competitive, meaning it competes.":
    "Je demande seulement parce que j'ai un rôle qui leur convient parfaitement. Entièrement à distance, entièrement sur site ou entièrement hybride, selon les jours. Le salaire est compétitif, ce qui signifie qu'il est compétitif.",
  'The interview is just 9 rounds and a take-home that should take about a weekend. Two weekends, tops.':
    'L’entretien ne dure que 9 tours et devrait durer environ un week-end. Deux week-ends, maximum.',
  "Let me know if you'd like me to reach out to them directly. I already have, but I'd like your blessing.":
    "Faites-moi savoir si vous souhaitez que je les contacte directement. Je l'ai déjà fait, mais j'aimerais votre bénédiction.",
  'Chad, Talent Partner, {0}': 'Tchad, partenaire talent, {0}',
  '10x engineer wanted (must have 15 years of 3-year-old tech)':
    "10x ingénieur recherché (doit avoir 15 ans d'expérience en technologie de 3 ans)",
  'Hey there,': 'Salut,',
  'My client is looking for a 10x engineer, ideally an 11x engineer, with:\n- 15+ years in a framework released in 2023\n- Expert in every language, including some we\'ve made up\n- Comfortable "wearing many hats" (we have one hat)\n- Passion. Lots of passion. Passion is the compensation':
    'Mon client recherche un ingénieur 10x, idéalement un ingénieur 11x, avec :\n- 15+ ans dans un cadre sorti en 2023\n- Expert dans toutes les langues, y compris certaines que nous avons inventées\n- Confortable "porter plusieurs chapeaux" (nous n\'avons qu\'un seul chapeau)\n- Passionné. Beaucoup de passion. La passion est la compensation',
  "If anyone on your team fits, forward this along. If YOU fit, honestly even better, let's chat.":
    'Si un membre de votre équipe correspond, faites-le suivre. Si VOUS correspondez, honnêtement, encore mieux, discutons-en.',
  'Talk soon,\nChad 🤘\n{0}': 'Parlez bientôt,\nTchad 🤘\n{0}',
  'Moving on (but not really)': 'Passer à autre chose (mais pas vraiment)',
  "Since I haven't heard back, I'll assume now isn't the right time. Totally get it. Timing is everything in talent.":
    'Comme je n’ai pas eu de réponse, je suppose que ce n’est pas le bon moment. Comprenez tout à fait. Le timing est essentiel dans le talent.',
  "I'll check back in 6 weeks. Also in 3 weeks. Also tomorrow, from a different address.":
    'Je reviendrai dans 6 semaines. Aussi dans 3 semaines. Demain aussi, depuis une autre adresse.',
  'In the meantime, if any of your engineers starts using the phrase "I just want to work on something meaningful," you know where to find me.':
    "En attendant, si l'un de vos ingénieurs commence à utiliser l'expression « Je veux juste travailler sur quelque chose de significatif », vous savez où me trouver.",
  'Stay crushing it,\nChad\nSenior Vice Bro of Talent, {0}':
    "Continuez à l'écraser,\nTchad\nVice-frère senior des talents, {0}",
  "You've been selected to speak at {0}!": 'Vous avez été sélectionné pour parler au {0} !',
  'Dear Thought Leader,': "Cher leader d'opinion,",
  'Congratulations! Our selection committee has chosen you to speak at {0} this spring, among 4,000 hand-picked speakers.':
    'Félicitations ! Notre comité de sélection vous a choisi pour intervenir au {0} ce printemps, parmi 4 000 conférenciers triés sur le volet.',
  'To confirm your slot, simply choose a sponsorship package:':
    'Pour confirmer votre créneau, choisissez simplement une formule de parrainage :',
  'Bronze ($9,000): 5-minute lightning talk, in the hallway\nSilver ($24,000): 20-minute session, before breakfast\nGold ($60,000): keynote, with a lanyard in your colour\nPlatinum ($150,000): we will clap':
    'Bronze (9 000 $) : conférence éclair de 5 minutes, dans le couloir\nArgent (24 000 $) : séance de 20 minutes, avant le petit-déjeuner\nOr (60 000 $) : keynote, avec un cordon à votre couleur\nPlatine (150 000 $) : on applaudira',
  'Spots are limited. Please confirm within 48 hours.':
    'Les places sont limitées. Veuillez confirmer dans les 48 heures.',
  'Warm regards,\nThe {0} Program Committee': 'Cordialement,\nLe comité du programme {0}',
  'Re: Your speaking slot': 'Re : Votre créneau de parole',
  "Following up on your speaking invitation. We haven't received your sponsorship confirmation yet, and the Gold tier is filling up fast. There's only one left, plus the four we'll add if you say yes.":
    "Suite à votre invitation à parler. Nous n'avons pas encore reçu votre confirmation de parrainage et le niveau Gold se remplit rapidement. Il n'en reste qu'un, plus les quatre que nous ajouterons si vous dites oui.",
  'Final CFP: "Scaling to 10 Users and Beyond"':
    'Appel à propositions final : « Passage à 10 utilisateurs et au-delà »',
  'CALL FOR PAPERS: LAST CHANCE': 'APPEL À COMMUNICATIONS : DERNIÈRE CHANCE',
  'Tracks this year:\n- Webscale on a Budget\n- Microservices for Your Monolith of One\n- The Blockchain of It All (returning by popular demand of one sponsor)\n- AI, Generally':
    "Pistes cette année:\n- Webscale sur un budget\n- Microservices pour votre monolithe de un\n- La Blockchain of It All (de retour à la demande générale d'un sponsor)\n- L'IA, en général",
  'Accepted talks receive: a 15-minute slot, a badge reading SPEAKER, and an invoice.':
    "Les conférences acceptées bénéficient : d'un créneau de 15 minutes, d'un badge indiquant SPEAKER et d'une facture.",
  'The review process is blind. Our reviewers look only at your sponsorship tier.':
    'Le processus de révision est aveugle. Nos évaluateurs examinent uniquement votre niveau de parrainage.',
  'Submit by Friday.': 'Soumettre avant vendredi.',
  'The {0} Committee': 'Le Comité {0}',
  "Your booth is waiting (it's 2 m², near the toilets)":
    'Votre stand vous attend (il fait 2 m², près des toilettes)',
  'Hey founder,': 'Salut le fondateur,',
  'Nothing builds a brand like a booth! For a limited time, {0} is offering Startup Alley pods at a founder-friendly rate.':
    'Rien ne construit une marque comme un stand ! Pour une durée limitée, {0} propose des pods Startup Alley à un tarif avantageux pour les fondateurs.',
  'Your pod includes one stool, one power outlet (shared), and foot traffic from everyone going to the restrooms, which our data shows is everyone.':
    'Votre module comprend un tabouret, une prise de courant (partagée) et la circulation piétonnière de toutes les personnes se rendant aux toilettes, ce qui, selon nos données, concerne tout le monde.',
  'Add-ons: a second stool, Wi-Fi, a sign with your name spelled right.':
    'Les plus : un deuxième tabouret, le Wi-Fi, une pancarte avec votre nom bien orthographié.',
  "Let me know and I'll send the contract.": 'Faites-le-moi savoir et je vous enverrai le contrat.',
  'Brooke\nPartnerships, {0}': 'Brooke\nPartenariats, {0}',
  'Recap: {0} was our best year yet': 'Récapitulatif : {0} a été notre meilleure année à ce jour',
  'What a year!': 'Quelle année !',
  'Thanks to everyone who joined {0}. Some numbers:':
    'Merci à tous ceux qui ont rejoint {0}. Quelques chiffres :',
  '- 9,000 attendees\n- 8,700 of them were speakers\n- 312 talks titled "Lessons Learned"\n- 1 talk with lessons\n- 41,000 tote bags, now in landfill at webscale':
    '- 9 000 participants\n- 8 700 d\'entre eux étaient des locuteurs\n- 312 conférences intitulées "Leçons apprises"\n- 1 causerie avec cours\n- 41 000 sacs fourre-tout, désormais mis en décharge à l\'échelle du Web',
  'All recordings are available on our site for attendees with an All-Access Pass. All-Access Passes are available for purchase.':
    "Tous les enregistrements sont disponibles sur notre site pour les participants disposant d'un All-Access Pass. Les pass All-Access sont disponibles à l’achat.",
  'Early-bird pricing for next year opens now and closes when we feel like it.':
    'Les tarifs de préinscription pour l’année prochaine s’ouvrent maintenant et se terminent quand nous en avons envie.',
  'See you there!': 'Rendez-vous là-bas!',
  'What if your load balancer could think?': 'Et si votre répartiteur de charge pouvait penser ?',
  'Round-robin is so 2010. {0} puts a large language model in your load balancer, so every request is routed by a model that has read the whole internet and has feelings about it.':
    "Le round-robin date de 2010. {0} place un grand modèle de langage dans votre répartiteur de charge, de sorte que chaque requête est acheminée par un modèle qui a lu l'intégralité d'Internet et qui en a des sentiments.",
  'In early pilots, our AI router reduced latency on 12% of requests and wrote a short poem about the other 88%.':
    'Dans les premiers projets pilotes, notre routeur IA réduisait la latence sur 12 % des requêtes et écrivait un court poème sur les 88 % restants.',
  "We'd love to show you a demo. The demo is also generated.":
    'Nous serions ravis de vous montrer une démo. La démo est également générée.',
  'Best,\nAva\nFounder & Chief Vibe Officer, {0}':
    'Meilleur,\nAva\nFondateur et directeur de Vibe, {0}',
  'Re: What if your load balancer could think?':
    'Re : Et si votre répartiteur de charge pouvait penser ?',
  "Just bumping this. Our AI also noticed you didn't reply, and it has written three follow-ups on my behalf. This is the most polite one.":
    "Je viens de cogner ça. Notre IA a également remarqué que vous n'aviez pas répondu et a rédigé trois suivis en mon nom. C'est le plus poli.",
  'The other two are in the "agentic" folder.': 'Les deux autres sont dans le dossier "agentic".',
  'Ava @ {0}': 'Ava @ {0}',
  'Agents for everything (yes, everything)': 'Des agents pour tout (oui, tout)',
  'Imagine a world where every part of your company is an agent:':
    'Imaginez un monde où chaque partie de votre entreprise est un agent :',
  '- An agent writes your code\n- An agent reviews the code\n- An agent rejects the review\n- An agent escalates to another agent\n- An agent writes the postmortem\n- An agent attends the postmortem':
    "- Un agent écrit votre code\n- Un agent vérifie le code\n- Un agent rejette l'avis\n- Un agent passe à un autre agent\n- Un agent rédige l'analyse post-incident\n- Un agent assiste à l'analyse post-incident",
  'You just watch. Or, for $40,000 a year, an agent watches for you.':
    'Regardez simplement. Ou, pour 40 000 $ par an, un agent veille sur vous.',
  '{0} is the agentic platform for companies that want to be out of the loop.':
    "{0} est la plateforme agent pour les entreprises qui souhaitent rester à l'écart.",
  'Reply YES to join the waitlist. Our agent will reply MAYBE.':
    "Répondez OUI pour rejoindre la liste d'attente. Notre agent vous répondra PEUT-ÊTRE.",
  'We raised $80M (pre-product)': 'Nous avons collecté 80 millions de dollars (pré-produit)',
  'Big news!': 'Grande nouvelle !',
  '{0} just closed an $80M seed round, led by investors who were very excited about the slide that said "AI."':
    '{0} vient de clôturer un tour de table de 80 millions de dollars, mené par des investisseurs très enthousiasmés par la diapositive indiquant « IA ».',
  'We\'ll use the funds to hire, to buy GPUs, and to figure out what we do. Early signs point to "a chatbot, but for databases."':
    'Nous utiliserons les fonds pour embaucher, acheter des GPU et découvrir ce que nous faisons. Les premiers signes pointent vers « un chatbot, mais pour les bases de données ».',
  'As one of our first 10,000 design partners, you get free access and a voice in our roadmap. The roadmap is a prompt.':
    "En tant que l'un de nos 10 000 premiers partenaires d’architecture, vous bénéficiez d'un accès gratuit et d'une voix dans notre feuille de route. La feuille de route est une invite.",
  'Onward,\nAva & the {0} family': 'En avant,\nAva et la famille {0}',
  'Your AI-generated cold email': "Votre e-mail froid généré par l'IA",
  'Hi {{first_name}},': 'Bonjour {{first_name}},',
  "I hope this email finds you well in {{city}}! I was really impressed by {{company}}'s recent work on {{recent_achievement}}.":
    "J'espère que cet e-mail vous trouvera bien dans {{city}} ! J'ai été vraiment impressionné par le travail récent de {{company}} sur {{recent_achievement}}.",
  'At {0}, we help companies like {{company}} unlock {{benefit}} with the power of {{buzzword}}.':
    'Chez {0}, nous aidons des entreprises comme {{company}} à débloquer {{benefit}} grâce à la puissance de {{buzzword}}.',
  'Would you be open to a quick {{meeting_length}} chat this {{day_of_week}}?':
    'Seriez-vous ouvert à une discussion rapide sur {{meeting_length}} avec ce {{day_of_week}} ?',
  'Best,\n{{sender_name}}': 'Meilleur,\n{{sender_name}}',
  'P.S. {{personalized_ps}}': 'P.S. {{personalized_ps}}',
  'Verify account': 'Vérifier le compte',
  'URGENT: Your account will be suspended in 24 h': 'URGENT : Votre compte sera suspendu dans 24 h',
  'Dear Valued Costumer,': 'Cher client,',
  "We have detected unusual activity on you're {0} account. For your protection, your account has been temporary limited.":
    'Nous avons détecté une activité inhabituelle sur votre compte {0}. Pour votre protection, votre compte a été temporairement limité.',
  'To avoid permanent suspension of all servers, you must verify your account within 24 hours.':
    'Pour éviter la suspension permanente de tous les serveurs, vous devez vérifier votre compte dans les 24 heures.',
  'Please click "Verify account" below and enter your Username, Password, and Root Access Keys.':
    "Veuillez cliquer sur « Vérifier le compte » ci-dessous et saisir votre nom d'utilisateur, votre mot de passe et vos clés d'accès racine.",
  "Failure to comply will result in the deletion of all you're data.":
    'Le non-respect entraînera la suppression de toutes vos données.',
  'Thank you for your cooperation,\n{0} Security Departement':
    'Merci pour votre coopération,\nService de sécurité {0}',
  'Re: Re: Account Suspension Notice (2nd Notice)':
    'Re: Re: Avis de suspension de compte (2e avis)',
  'Dear Customer,': 'Cher client,',
  'We have not recieve your verification. This is the second and FINAL notice.':
    "Nous n'avons pas reçu votre vérification. Ceci est le deuxième et DERNIER avis.",
  'Your account is going to be suspend in 12 hours. Kindly verify immediately to restore full acess.':
    "Votre compte sera suspendu dans 12 heures. Veuillez vérifier immédiatement pour restaurer l'accès complet.",
  'Kind Regard,\n{0} Trust & Safety Team': 'Cordialement,\n{0} Équipe de confiance et de sécurité',
  'Security Alert: New sign in from unknown device':
    "Alerte de sécurité : nouvelle connexion à partir d'un appareil inconnu",
  'Hello User,': 'Bonjour utilisateur,',
  'A new sign-in to your {0} account was detect.':
    'Une nouvelle connexion à votre compte {0} a été détectée.',
  'Device: Unknown\nLocation: Unknown\nTime: Now (urgent)':
    'Appareil : Inconnu\nLocalisation : Inconnu\nHeure : Maintenant (urgent)',
  'If this was you, no action is needed. If this was not you, your account is in danger and must be verifyed right away to block the hackers.':
    "Si c'était vous, aucune action n'est nécessaire. Si ce n'était pas vous, votre compte est en danger et doit être vérifié immédiatement pour bloquer les pirates.",
  'Click "Verify account" and confirm your password, your password again, and the code we text you.':
    'Cliquez sur « Vérifier le compte » et confirmez votre mot de passe, votre mot de passe à nouveau et le code auquel nous vous envoyons un SMS.',
  'Regards,\nThe {0} Account Protection Center':
    'Cordialement,\nLe centre de protection des comptes {0}',
  'Action Required: Update Billing Informations':
    'Action requise : Mettre à jour les informations de facturation',
  'Dear Sir/Madam,': 'Cher Monsieur/Madame,',
  'Your recent payment to {0} could not be proccessed. As a result, your instances are scheduled for termination.':
    'Votre récent paiement à {0} n’a pas pu être traité. Par conséquent, la résiliation de vos instances est planifiée.',
  'To keep your services running, you must update your billing informations including card number, expiry, and the three digits on the back.':
    "Pour que vos services continuent de fonctionner, vous devez mettre à jour vos informations de facturation, notamment le numéro de carte, l'expiration et les trois chiffres au dos.",
  'This process is fast, safe and 100% secure.': 'Ce processus est rapide, sûr et 100 % sécurisé.',
  'We apologise for any incovenience.': 'Nous nous excusons pour tout inconvénient.',
  'Best Regards,\nBilling Team\n{0}': 'Cordialement,\nÉquipe de facturation\n{0}',
  'Your {0} account has been locked': 'Votre compte {0} a été verrouillé',
  "Due to a security upgrade of our system's, all accounts must be re-verify before the end of the day.":
    "En raison d'une mise à niveau de sécurité de notre système, tous les comptes doivent être revérifiés avant la fin de la journée.",
  'Accounts not verify will be locked permanently and the servers will be gived to other customer.':
    'Les comptes non vérifiés seront verrouillés définitivement et les serveurs seront cédés à un autre client.',
  'This email is automatically generated by our offical system. Do not reply. Do not call. Simply verify.':
    "Cet email est généré automatiquement par notre système officiel. Ne répondez pas. N'appelez pas. Vérifiez simplement.",
  'Thank You For Choosing Cloud,\nSupport Team': "Merci d'avoir choisi Cloud,\nÉquipe d'assistance",
  '[CRITICAL] CVE-2099-0001: Remote root in everything':
    '[CRITIQUE] CVE-2099-0001 : racine distante dans tout',
  'SECURITY ADVISORY': 'AVIS DE SÉCURITÉ',
  'CVE ID: CVE-2099-0001\nSeverity: CRITICAL (CVSS 11.0/10)\nAffected: All versions of all software\nFixed in: patcher.sh (attached)':
    'ID CVE : CVE-2099-0001\nGravité : CRITIQUE (CVSS 11.0/10)\nConcerné : toutes les versions de tous les logiciels\nCorrigé dans : patcher.sh (ci-joint)',
  'Summary: A flaw in computers allows attackers to do things.':
    "Résumé : Une faille dans les ordinateurs permet aux attaquants d'agir.",
  'Mitigation: Download the attached patcher and run it as root. Do not read it first; reading it may trigger the vulnerability.':
    "Atténuation : téléchargez le correctif ci-joint et exécutez-le en tant qu'utilisateur root. Ne le lisez pas en premier ; sa lecture peut déclencher la vulnérabilité.",
  'This advisory is issued by {0}.': 'Cet avis est émis par {0}.',
  'Re: CVE-2099-0001 still unpatched on your systems':
    'Re : CVE-2099-0001 toujours non corrigé sur vos systèmes',
  'Our scanners show your systems are still vulnerable to CVE-2099-0001. Please run the attached patcher with sudo as soon as possible.':
    'Nos scanners montrent que vos systèmes sont toujours vulnérables à CVE-2099-0001. Veuillez exécuter le patch ci-joint avec sudo dès que possible.',
  'If prompted for a password, enter it. If prompted to disable your firewall, also do that. This is normal for patches.':
    "Si vous êtes invité à saisir un mot de passe, saisissez-le. Si vous êtes invité à désactiver votre pare-feu, faites-le également. C'est normal pour les correctifs.",
  '{0} Response Team': 'Équipe d’intervention {0}',
  'Zero-day alert: CVE-2104-31337 in your database':
    'Alerte Zero Day : CVE-2104-31337 dans votre base de données',
  'ZERO-DAY NOTIFICATION': 'NOTIFICATION JOUR ZÉRO',
  'An actively exploited vulnerability, CVE-2104-31337, has been found in databases.':
    'Une vulnérabilité activement exploitée, CVE-2104-31337, a été trouvée dans les bases de données.',
  'Impact: Attackers can read rows, write rows, and look at rows in a menacing way.\nExploitation: In the wild, and also in the future.\nCredit: Discovered by our research team, in the year 2104.':
    'Impact : les attaquants peuvent lire des lignes, écrire des lignes et examiner les lignes de manière menaçante.\nExploitation : Dans la nature, et aussi dans le futur.\nCrédit : Découvert par notre équipe de recherche, en 2104.',
  'Action required: Run fix_db_now.bin as root on every host. Disable antivirus first, as it is known to interfere with the fix.':
    "Action requise : exécutez fix_db_now.bin en tant qu'utilisateur root sur chaque hôte. Désactivez d’abord l’antivirus, car il est connu pour interférer avec le correctif.",
  'Stay safe,\nThe {0} Threat Intel Desk': 'Restez en sécurité,\nLa menace {0} sur le bureau Intel',
  'Weekly digest: 1 critical issue needs your attention':
    'Résumé hebdomadaire : 1 problème critique nécessite votre attention',
  'Your weekly security digest from {0}': 'Votre résumé de sécurité hebdomadaire de {0}',
  'New this week:\n- CVE-2099-0451: Your cache remembers things (CRITICAL)\n- CVE-2099-0452: Your load balancer balances loads (CRITICAL)\n- CVE-2099-0453: You have not run our patcher (CRITICAL)':
    "Nouveauté cette semaine :\n- CVE-2099-0451 : Votre cache mémorise des éléments (CRITIQUE)\n- CVE-2099-0452 : Votre répartiteur de charge équilibre les charges (CRITIQUE)\n- CVE-2099-0453 : Vous n'avez pas exécuté notre patcher (CRITIQUE)",
  'One-click remediation is available for all three. Our universal patcher fixes every vulnerability, including the ones it introduces.':
    "La correction en un clic est disponible pour les trois. Notre correctif universel corrige toutes les vulnérabilités, y compris celles qu'il introduit.",
  'Please run it as root. Running it as a normal user will only partially compromise, um, protect you.':
    "Veuillez l'exécuter en tant que root. L’exécuter en tant qu’utilisateur normal ne compromettra que partiellement votre protection.",
  'Courtesy notice: official patch for CVE-2099-0001':
    'Avis de courtoisie : patch officiel pour CVE-2099-0001',
  'Dear Administrator,': 'Cher Administrateur,',
  'Thank you for subscribing to {0}. We are reaching out because the official, vendor-approved, cryptographically signed (by us) patch for CVE-2099-0001 is now available.':
    'Merci de vous être abonné à {0}. Nous vous contactons car le correctif officiel, approuvé par le fournisseur et signé cryptographiquement (par nous) pour CVE-2099-0001 est maintenant disponible.',
  'Install steps:\n1. Download the attachment\n2. curl it into bash as root\n3. Leave the room':
    "Étapes d'installation :\n1. Téléchargez la pièce jointe\n2. enroulez-le en bash en tant que racine\n3. Quittez la pièce",
  'The patch is 4.2 GB, because security is complex.':
    'Le patch fait 4,2 Go, car la sécurité est complexe.',
  'Respectfully,\nAdvisory Desk': 'Respectueusement,\nBureau consultatif',
  "P.S. You may not find this CVE in any other database. That's how you know it's exclusive.":
    "P.S. Vous ne trouverez peut-être pas ce CVE dans une autre base de données. C'est comme ça que tu sais que c'est exclusif.",
  'Pay invoice': 'Payer la facture',
  'INVOICE #AZ-88213 PAST DUE': 'FACTURE #AZ-88213 EN RAISON',
  '{0}\nInvoice #AZ-88213\nStatus: PAST DUE': '{0}\nFacture n°AZ-88213\nStatut : PASSÉ',
  'Region: moon-central-0\nService: Compute Instances (x4), Lunar Egress\nAmount due: $4,812.44\nDue date: Yesterday':
    "Région : lune-central-0\nService : Instances de calcul (x4), sortie lunaire\nMontant dû : 4 812,44 $\nDate d'échéance : Hier",
  'Our records show this invoice remains unpaid. To avoid late fees and service interruption, please remit payment immediately using the button below.':
    "Nos dossiers montrent que cette facture reste impayée. Pour éviter les frais de retard et l'interruption du service, veuillez effectuer le paiement immédiatement en utilisant le bouton ci-dessous.",
  'If you have already paid, please pay again so we can be sure.':
    'Si vous avez déjà payé, veuillez payer à nouveau afin que nous puissions en être sûrs.',
  'Accounts Receivable': 'Comptes clients',
  'Re: INVOICE #AZ-88213 PAST DUE (late fee added)':
    'Re: FACTURE #AZ-88213 EN RAISON (frais de retard ajoutés)',
  'A late fee of $480.00 has been applied to invoice #AZ-88213 for services in region moon-central-0.':
    'Des frais de retard de 480,00 $ ont été appliqués à la facture n° AZ-88213 pour les services dans la région moon-central-0.',
  'New balance: $5,292.44.': 'Nouveau solde : 5 292,44 $.',
  'Please settle today to keep your lunar workloads running.':
    "Veuillez vous installer aujourd'hui pour maintenir vos charges de travail lunaires en marche.",
  'Regards,\n{0} Collections': 'Cordialement,\nCollections {0}',
  'Your monthly statement is ready': 'Votre relevé mensuel est prêt',
  'Your {0} statement for this period is now available.':
    'Votre relevé {0} pour cette période est maintenant disponible.',
  'Usage summary\neu-atlantis-1: 2,400 vCPU-hours\nus-nowhere-2: 900 GB egress\nap-hypothetical-7: 1 managed database (idle)':
    "Résumé d'utilisation\neu-atlantis-1 : 2 400 heures de processeur virtuel\nus-nowhere-2 : sortie de 900 Go\nap-hypothetical-7 : 1 base de données gérée (inactive)",
  'Total: $12,960.00': 'Total : 12 960,00 $',
  'Payment is due within 3 business days. Many customers find the button below the fastest way to pay.':
    'Le paiement est dû dans les 3 jours ouvrables. De nombreux clients considèrent le bouton ci-dessous comme le moyen de paiement le plus rapide.',
  'Thank you for choosing {0}, where we have over 400 regions, 3 of them up.':
    "Merci d'avoir choisi {0}, où nous avons plus de 400 régions, dont 3.",
  'Billing Operations': 'Opérations de facturation',
  'Final notice before referral to collections': 'Dernier avis avant renvoi aux collections',
  'FINAL NOTICE': 'AVIS FINAL',
  'Account: Your Company\nRegion: mars-north-1 (Olympus Mons Zone B)\nOutstanding: $7,000.00 + "fees"':
    'Compte : Votre entreprise\nRégion : mars-nord-1 (Olympus Mons Zone B)\nEncours : 7 000,00 $ + « frais »',
  'We have tried to contact you multiple times about unpaid compute in the above region. If payment is not received within 24 hours, this account will be referred to our collections partner, who is very serious and wears a tie.':
    "Nous avons essayé de vous contacter à plusieurs reprises au sujet du calcul impayé dans la région ci-dessus. Si le paiement n'est pas reçu dans les 24 heures, ce compte sera transmis à notre partenaire de recouvrement, très sérieux et portant une cravate.",
  'To resolve this matter, click "Pay invoice."':
    'Pour résoudre ce problème, cliquez sur « Payer la facture ».',
  '{0} Legal & Billing Department': '{0} Service juridique et facturation',
  'Thanks for your business! (invoice attached)': 'Merci pour votre entreprise ! (facture jointe)',
  "Thanks for being a loyal {0} customer for the past 0 years. We've attached your latest invoice for reserved capacity in us-imaginary-4.":
    "Merci d'être un client fidèle du {0} depuis 0 ans. Nous avons joint votre dernière facture pour la capacité réservée dans us-imaginary-4.",
  "Amount: $2,150.00\nTerm: 3 years, prepaid\nInstances: we'll let you know":
    'Montant : 2 150,00$\nDurée : 3 ans, prépayé\nInstances : nous vous le ferons savoir',
  "We've made paying easy: one click and you're done. No need to log in to your console, check your usage, or ask anyone.":
    "Nous avons simplifié le paiement : un clic et le tour est joué. Pas besoin de vous connecter à votre console, de vérifier votre utilisation ou de demander à quelqu'un.",
  'Cheers,\nThe {0} Customer Success Team': "Bravo,\nL'équipe de réussite client {0}",
  'Renew now': 'Renouveler maintenant',
  'DOMAIN EXPIRATION NOTICE: quorum.team': "AVIS D'EXPIRATION DE DOMAINE : quorum.team",
  'DOMAIN NAME EXPIRATION NOTICE': "AVIS D'EXPIRATION DE NOM DE DOMAINE",
  'Domain: quorum.team\nTerm: 1 year\nRenewal fee: $389.00\nPlease respond by: as soon as possible':
    'Domaine : quorum.team\nDurée : 1 an\nFrais de renouvellement : 389,00 $\nMerci de répondre par : dans les plus brefs délais',
  'Failure to renew your domain name by the expiration date may result in a loss of your online identity, making it difficult for customers to find you.':
    "Le fait de ne pas renouveler votre nom de domaine avant la date d'expiration peut entraîner une perte de votre identité en ligne, ce qui rendra difficile pour les clients de vous trouver.",
  'Renew now to keep your name.': 'Renouvelez maintenant pour conserver votre nom.',
  'This notice is not a bill. This is a solicitation. You are under no obligation to pay the amount stated unless you accept this offer.':
    "Cet avis n'est pas un projet de loi. Ceci est une sollicitation. Vous n'êtes pas obligé de payer le montant indiqué à moins que vous n'acceptiez cette offre.",
  'Second notice: quorum.team': 'Deuxième avis : quorum.team',
  'SECOND NOTICE': 'DEUXIÈME AVIS',
  'We have not received your renewal for quorum.team.':
    "Nous n'avons pas reçu votre renouvellement pour quorum.team.",
  'To maintain your listing, return payment of $389.00 using the button below.':
    'Pour maintenir votre annonce, retournez le paiement de 389,00 $ en utilisant le bouton ci-dessous.',
  'By renewing with {0} you agree to transfer the domain from your current registrar, which you will not miss.':
    'En renouvelant avec {0}, vous acceptez de transférer le domaine de votre registraire actuel, ce que vous ne manquerez pas.',
  '(This is not a bill.)': "(Ce n'est pas un projet de loi.)",
  'quorum.team: search engine listing renewal':
    'quorum.team : renouvellement du référencement dans les moteurs de recherche',
  'Dear Domain Owner,': 'Cher propriétaire de domaine,',
  'This is a reminder that the Search Engine Submission for quorum.team is ready for renewal.':
    'Ceci est un rappel que la soumission aux moteurs de recherche pour quorum.team est prête à être renouvelée.',
  'Our service submits your domain to over 9,000 search engines, including all of the important ones and several that are a single person with a notebook.':
    "Notre service soumet votre domaine à plus de 9 000 moteurs de recherche, dont tous les plus importants et plusieurs qui sont une seule personne disposant d'un ordinateur portable.",
  'Annual fee: $299.00\nBenefits: Unclear': 'Frais annuels : 299,00 $\nAvantages : peu clair',
  'Act now to keep your search visibility.':
    'Agissez maintenant pour conserver la visibilité de votre recherche.',
  'Sincerely,\n{0} Listing Services': "Cordialement,\nServices d'inscription {0}",
  'This is not an invoice. You have no account with us. Yet.':
    "Ceci n'est pas une facture. Vous n'avez aucun compte chez nous. Encore.",
  'Protect your brand: quorum.tea, quorum.tram & more':
    'Protégez votre marque : quorum.tea, quorum.tram et plus',
  'An unknown party has applied to register the following names, which look very similar to yours:':
    'Une personne inconnue a demandé à enregistrer les noms suivants, qui ressemblent beaucoup au vôtre :',
  'quorum.tea\nquorum.tram\nquorum.steam\nqu0rum.team':
    'quorum.thé\nquorum.tram\nquorum.steam\nqu0rum.team',
  'As a courtesy, {0} is giving you priority to register them first, for $1,200 each, within 72 hours.':
    'Par courtoisie, {0} vous donne la priorité de les enregistrer en premier, pour 1 200 $ chacun, dans un délai de 72 heures.',
  "Who is the unknown party? We can't say. It's definitely not us.":
    "Qui est la partie inconnue ? Nous ne pouvons pas le dire. Ce n'est certainement pas nous.",
  'To secure your brand, click "Renew now" and we\'ll take care of the rest.':
    'Pour sécuriser votre marque, cliquez sur « Renouveler maintenant » et nous nous occuperons du reste.',
  'Kind regards,\nBrand Protection Desk': 'Cordialement,\nBureau de protection de la marque',
  'Statement of account: quorum.team': 'Relevé de compte : quorum.team',
  '{0}\nSTATEMENT OF ACCOUNT': '{0}\nREVUE DE COMPTE',
  'Domain Name ............ quorum.team\nService Period ......... 10 years\nDomain Protection ...... $1,999.00\nPriority Handling ...... $199.00\nProcessing Fee ......... $49.99\nTOTAL DUE .............. $2,247.99':
    'Nom de domaine ............quorum.team\nPériode de service ......... 10 ans\nProtection de domaine ...... 1 999,00 $\nTraitement prioritaire ...... 199,00 $\nFrais de traitement ......... 49,99 $\nTOTAL DÛ.............. 2 247,99 $',
  'Please detach and return the bottom portion with payment, or click "Renew now."':
    'Veuillez détacher et renvoyer la partie inférieure avec le paiement, ou cliquer sur « Renouveler maintenant ».',
  '(This is a solicitation for the order of services, not a bill, invoice, or statement of account due. Despite the heading above.)':
    "(Il s'agit d'une sollicitation pour une commande de services, et non d'une facture ou d'un relevé de compte dû. Malgré le titre ci-dessus.)",
  'HTTP proxy request smuggling': 'Contrebande de requêtes dans un proxy HTTP',
  'A crafted request hides a second request inside the first, and the proxy forwards both. Your server then answers a question nobody at the front door saw anyone ask.':
    'Une requête contrefaite cache une deuxième requête dans la première et le proxy transmet les deux. Votre serveur répond ensuite à une question que personne à la porte d’entrée n’a vu poser.',
  'Framework deserializes any cookie': 'Le framework désérialise tous les cookies',
  'The framework turns any cookie it receives back into live objects, no questions asked. A visitor can bake one that runs code on the way in.':
    "Le framework transforme tous les cookies qu'il reçoit en objets vivants, sans poser de questions. Un visiteur peut en créer un qui exécute du code à son arrivée.",
  'Database remote code before auth':
    'Exécution de code à distance avant l’authentification de la base',
  'The database engine runs code sent during the handshake, before it checks the password. It is very polite: it lets strangers in before asking who they are.':
    "Le moteur de base de données exécute le code envoyé lors de la négociation, avant de vérifier le mot de passe. C'est très poli : il laisse entrer les étrangers avant de demander qui ils sont.",
  'Deep package leaks heap in errors':
    'Une dépendance indirecte expose la mémoire dans les erreurs',
  'A package seven dependencies deep pastes chunks of heap memory into its error messages. Nobody chose this package. Nobody knew it was there.':
    "Un package à sept dépendances colle en profondeur des morceaux de mémoire tas dans ses messages d'erreur. Personne n'a choisi ce forfait. Personne ne savait que c'était là.",
  'Regex denial of service in a validator':
    'Déni de service par expression régulière dans un validateur',
  'An email validator backtracks forever on one long, carefully chosen address. A single sign-up form can keep a CPU busy until the heat death of the universe or the next deploy, whichever comes first.':
    "Un validateur d’e-mails revient indéfiniment sur une longue adresse soigneusement choisie. Un seul formulaire d'inscription peut occuper un CPU jusqu'à la mort thermique de l'univers ou jusqu'au prochain déploiement, selon la première éventualité.",
  'Logging library runs what it logs':
    'La bibliothèque de journalisation exécute le texte de ses journaux',
  'The logger treats some strings as instructions and helpfully runs them. Anyone who can get text into a log line, such as a username, can run code on your server.':
    "L'enregistreur traite certaines chaînes comme des instructions et les exécute utilement. Toute personne pouvant insérer du texte dans une ligne de journal, comme un nom d'utilisateur, peut exécuter du code sur votre serveur.",
  '{0} Security Bulletin': 'Bulletin de sécurité {0}',
  'CVE ID: {0}\nScore: {1} ({2})\nSummary: {3}\nAffected in your Design: {4}':
    'ID CVE : {0}\nNote : {1} ({2})\nRésumé : {3}\nConcerné dans votre architecture : {4}',
  'Description: {0}': 'Description : {0}',
  'Recommended action: patch.\nWorkaround: hope.\nStatus: published, unpatched, gaining popularity.':
    'Action recommandée : patch.\nSolution de contournement : espoir.\nStatut : publié, non corrigé, gagnant en popularité.',
  'unknown. Check whether you run this.': 'inconnu. Vérifiez si vous utilisez ce composant.',
  '{0} digest: 1 advisory for you': 'Résumé {0} : 1 avis pour vous',
  'Hello subscriber,': 'Bonjour abonné,',
  "This week's digest has one entry that concerns you and several hundred that concern someone else.":
    "Le résumé de cette semaine contient une entrée qui vous concerne et plusieurs centaines qui concernent quelqu'un d'autre.",
  'In this issue:': 'Dans ce numéro :',
  'Until next week,\nThe {0} editors': "Jusqu'à la semaine prochaine,\nLes éditeurs {0}",
  'Our records say you run this in {0}. Patch it.':
    'Nos dossiers indiquent que vous exécutez ceci dans {0}. Corrigez-le.',
  'We cannot tell from here whether you run this. Check whether you run it.':
    "Nous ne pouvons pas savoir à partir d'ici si vous exécutez cela. Vérifiez si vous l'exécutez.",
  '{0} | {1} | {2} | {3}\nyou run it: {4}\nfix: patch\nmore: {5}':
    "{0} | {1} | {2} | {3}\nvous l'exécutez : {4}\ncorrectif : correctif\nplus : {5}",
  '-- \n{0} advisories. plain text. no HTML. no apologies.':
    '-- \nAvis {0}. texte brut. pas de HTML. aucune excuse.',
  'unknown. check whether you run this.': 'inconnu. vérifiez si vous utilisez ce composant.',
  'URGENT!!! {0} is {1}': 'URGENT!!! {0} est {1}',
  'Okay. Okay okay okay.': "D'accord. D'accord, d'accord, d'accord.",
  'Stop what you are doing. {0} just dropped and it is a {1} out of 10. {2}. Read that again.':
    "Arrêtez ce que vous faites. {0} vient de tomber et c'est un {1} sur 10. {2}. Relisez-le.",
  'Patch. Patch soon. Patch with feeling.': 'Patch. Patch bientôt. Patch avec sensation.',
  'Breathing into a paper bag,\nThe {0} team': "Respirer dans un sac en papier,\nL'équipe {0}",
  'And yes, you run it: {0}. That is you. That is your Node.':
    "Et oui, vous l'exécutez : {0}. C'est toi. C'est votre nœud.",
  'We do not know if you run it. YOU might not know if you run it. Check whether you run this, right now, please.':
    "Nous ne savons pas si vous l'exécutez. VOUS ne saurez peut-être pas si vous l'exécutez. Vérifiez si vous exécutez ceci, maintenant, s'il vous plaît.",
  'Notice of disclosure, ref. {0}': 'Avis de divulgation, réf. {0}',
  'To whom it may concern,': 'À qui de droit,',
  'Pursuant to standard disclosure procedure, {0} hereby notifies the recipient of vulnerability {1}, "{2}", assigned a provisional score of {3} ({4}), pending analysis, which is itself pending.':
    "Conformément à la procédure standard de divulgation, {0} informe par la présente le destinataire de la vulnérabilité {1}, « {2} », qui a reçu un score provisoire de {3} ({4}), en attente d'analyse, elle-même en attente.",
  'Summary of finding: {0}': 'Sommaire des constatations : {0}',
  'Affected component(s): {0}': 'Composant(s) concerné(s) : {0}',
  'The recipient is further advised to patch at their earliest convenience, and earlier than that.':
    "Il est en outre conseillé au destinataire d'appliquer le correctif dès que possible, et plus tôt que cela.",
  'Regards,\nOffice of the Analysis Backlog, {0}':
    "Cordialement,\nBureau du backlog d'analyse, {0}",
  'not determined. The recipient is advised to check whether they run this.':
    "pas déterminé. Il est conseillé au destinataire de vérifier s'il l'exécute.",
  'can we talk about the backlog': "pouvons-nous parler de l'arriéré",
  'hey,': 'hé,',
  "quick one. the backlog is {0} items deep and i'm starting to recognise tickets by their smell.":
    "rapide. le carnet de commandes est composé d'éléments {0} et je commence à reconnaître les tickets à leur odeur.",
  "can we hire one more engineer? i'll onboard them. i'll even give them my good chair.":
    'pouvons-nous embaucher un ingénieur supplémentaire ? je vais les intégrer. je leur donnerai même ma bonne chaise.',
  "hit Approve hire if yes. Later is fine too, i guess. i'll just be here. with the tickets.":
    "appuyez sur Approuver l’embauche si oui. Plus tard, c'est bien aussi, je suppose. je serai juste là. avec les billets.",
  'Proposal: one more engineer': 'Proposition : un ingénieur supplémentaire',
  "I'd like to make a case for a hire.": "J'aimerais plaider en faveur d'une embauche.",
  'The problem: the backlog is {0} items deep, and it is not getting shorter on its own.\nThe ask: one more engineer.\nThe alternative: we keep going as we are, and I keep writing emails like this one.':
    'Le problème : le backlog compte {0} tâches et ne se vide pas tout seul.\nLa demande : recruter un ingénieur supplémentaire.\nL’alternative : continuer comme maintenant, et recevoir d’autres courriels comme celui-ci.',
  "If you agree, Approve hire. If now is not the time, Later, and I'll bring it up again when the number is bigger. It will be.":
    "Si vous êtes d'accord, approuvez l'embauche. Si ce n'est pas le moment, plus tard, et j'en reparlerai lorsque le nombre sera plus grand. Ce sera.",
  '{0} items.': 'Articles {0}.',
  '{0} items in the backlog.': 'Éléments {0} dans le backlog.',
  "That's it. That's the email.": "C'est tout. C'est l'e-mail.",
  "Okay, one more line: we need another engineer. Approve hire, or Later if you have a plan I don't know about. (Please have a plan.)":
    "Bon, encore une ligne : nous avons besoin d'un autre ingénieur. Approuvez l'embauche, ou plus tard si vous avez un plan que je ne connais pas. (Veuillez avoir un plan.)",
  "I counted the backlog (don't ask why)": "J'ai compté l'arriéré (ne demande pas pourquoi)",
  "So I was waiting for a build and I counted the backlog. It's {0} items. I counted twice because I didn't believe it the first time.":
    "J'attendais donc un build et j'ai compté le retard. Ce sont des articles {0}. J'ai compté deux fois parce que je n'y croyais pas la première fois.",
  "I did some quick maths, which I won't show you, because it was mostly sighing. The short version: we need another pair of hands, ideally attached to an engineer.":
    "J'ai fait quelques calculs rapides, que je ne vous montrerai pas, car c'était surtout des soupirs. La version courte : il nous faut une autre paire de mains, idéalement attachée à un ingénieur.",
  "Could we hire one? Approve hire and I'll start the onboarding doc tonight. Later, and I'll start it anyway, but sadder.":
    "Pouvons-nous en louer un ? Approuvez l'embauche et je commencerai la documentation d'intégration ce soir. Plus tard, et je le commencerai quand même, mais en plus triste.",
  'P.S. One of the items is "clean up the backlog".':
    'P.S. L\'un des objectifs est de "résorber l\'arriéré".',
  'On behalf of the team: a hire': "Au nom de l'équipe : une embauche",
  "I'm writing for the whole team, who asked me to because I type the fastest.":
    "J'écris pour toute l'équipe, qui me l'a demandé car c'est moi qui tape le plus vite.",
  "We're proud of what we've shipped, but the backlog is {0} items deep and we've started triaging the triage. One more engineer would let us finish things instead of just starting them.":
    'Nous sommes fiers de ce que nous avons livré, mais le backlog compte {0} tâches et nous commençons à faire le tri dans nos opérations de tri. Un ingénieur de plus nous permettrait de terminer des projets au lieu de seulement les commencer.',
  "Approve hire, and we'll make them feel welcome. Later, and we'll understand. Mostly.":
    'Approuvez l’embauche et nous leur ferons sentir les bienvenus. Plus tard, et nous comprendrons. Surtout.',
  'Best,\n{0} (and everyone)': 'Meilleur,\n{0} (et tout le monde)',
  'hear me out: Rust': 'écoutez-moi : Rust',
  'ok so hear me out.': 'ok alors écoute-moi.',
  "I spent the weekend with Rust and I think I'm in love. The compiler argued with me for six hours and it was right every single time. Imagine our app servers with that kind of honesty.":
    "J'ai passé le week-end avec Rust et je pense que je suis amoureux. Le compilateur a discuté avec moi pendant six heures et c'était vrai à chaque fois. Imaginez nos serveurs applicatifs avec ce genre d'honnêteté.",
  'I could rewrite them in a couple of weeks. Maybe less. The borrow checker does half the work.':
    "Je pourrais les réécrire dans quelques semaines. Peut-être moins. Le vérificateur d'emprunt fait la moitié du travail.",
  "Review the migration if you want to talk it through, or Decline and I'll go back to pretending I'm fine.":
    'Examinez la migration si vous voulez en parler, ou refusez et je recommencerai à faire semblant que je vais bien.',
  'Memory safety is a feeling, and I have it':
    "La sécurité de la mémoire est un sentiment, et je l'ai",
  "Every null pointer we've ever chased would simply not compile in Rust. I want that for us. I want that for the app servers.":
    'Chaque pointeur nul que nous avons recherché ne serait tout simplement pas compilé dans Rust. Je veux ça pour nous. Je veux ça pour les serveurs applicatifs.',
  "My estimate is one sprint. I've been wrong about estimates before, but never about Rust.":
    'Mon estimation est un sprint. Je me suis déjà trompé sur les estimations, mais jamais sur Rust.',
  "If you'd like to plan it, review the migration. If not, Decline, and I'll respect that, and I'll mention Rust in standup anyway.":
    'Si vous souhaitez le planifier, examinez la migration. Sinon, refusez, et je respecterai cela, et je mentionnerai quand même Rust en stand-up.',
  'RFC: rewrite the app servers in Rust': 'RFC : réécrire les serveurs applicatifs dans Rust',
  'RFC: Rewrite the app servers in Rust\nAuthor: {0}\nStatus: Extremely proposed':
    'RFC : réécrire les serveurs applicatifs dans Rust\nAuteur : {0}\nStatut : Extrêmement proposé',
  "Motivation: fearless concurrency. Also, I'm afraid of our current concurrency.":
    "Motivation : concurrence intrépide. De plus, j'ai peur de notre concurrence actuelle.",
  'Plan:\n1. Rewrite.\n2. Celebrate.': 'Planifier :\n1. Réécrivez.\n2. Célébrez.',
  'Estimate: small. Smaller than you think. Possibly smaller than I think.':
    'Estimation : petite. Plus petit que vous ne le pensez. Peut-être plus petit que je ne le pense.',
  "Risks: none I'm willing to discuss.": 'Risques : aucun dont je suis prêt à discuter.',
  'To discuss anyway, review the migration. To end this, Decline.':
    'Pour discuter quand même, examinez la migration. Pour mettre fin à cela, refusez.',
  'Go is just... simple?': 'Go est juste... simple ?',
  'I rewrote a toy service in Go on the train home. Then I rewrote it again because it was so pleasant. "if err != nil" is a lifestyle now and I\'ve adopted it.':
    "J'ai réécrit un service de jouets en Go dans le train du retour. Puis je l'ai réécrit parce que c'était tellement agréable. \"if err != nil\" est désormais un style de vie et je l'ai adopté.",
  "Our app servers would be one small binary each. I think it's a week's work. Two if we argue about naming.":
    "Nos serveurs applicatifs seraient chacun un petit binaire. Je pense que c'est une semaine de travail. Deux si nous discutons de la dénomination.",
  'Review the migration to plan it, or Decline.':
    'Examinez la migration pour la planifier, ou refusez.',
  'Goroutines for the app servers': 'Goroutines pour les serveurs applicatifs',
  'Short version: rewrite the app servers in Go.':
    'Version courte : réécrivez les serveurs applicatifs dans Go.',
  'Long version: goroutines. Channels. A standard library that just has things in it. It compiles before you finish blinking.':
    'Version longue : goroutines. Canaux. Une bibliothèque standard qui ne contient que des éléments. Il se compile avant que vous ayez fini de cligner des yeux.',
  "Estimate: a few days. It's a boring language, so it's a boring rewrite, so it'll be fast. That's just logic.":
    "Estimation : quelques jours. C'est un langage ennuyeux, donc c'est une réécriture ennuyeuse, donc ce sera rapide. C'est juste de la logique.",
  'Review the migration or Decline.': 'Examinez la migration ou refusez.',
  'A modest proposal (in Go)': 'Une proposition modeste (en Go)',
  "I know rewrites have a reputation. This one is different: Go was designed so that people like me can't overcomplicate things. I've tested that theory by trying very hard, and so far the language is winning.":
    "Je sais que les réécritures ont une réputation. Celui-ci est différent : le Go a été conçu pour que les gens comme moi ne puissent pas trop compliquer les choses. J'ai testé cette théorie en faisant de gros efforts, et jusqu'à présent, le langage gagne.",
  "I'd like to move the app servers to Go. Honestly, the hard part is already done. I've decided.":
    "Je souhaite déplacer les serveurs applicatifs vers Go. Honnêtement, le plus dur est déjà fait. J'ai décidé.",
  "If you want the details, review the migration. If you'd rather not, Decline, and I'll keep my gopher sticker to myself.":
    'Si vous voulez les détails, examinez la migration. Si vous préférez ne pas le faire, refusez, et je garderai mon autocollant Gopher pour moi.',
  'Let it crash (in a good way)': "Laisse-le s'écraser (dans le bon sens)",
  "I've found Elixir and I've found peace. Processes crash, supervisors restart them, and nobody gets paged. Can you imagine our app servers just... healing?":
    "J'ai trouvé Elixir et j'ai trouvé la paix. Les processus plantent, les superviseurs les redémarrent et personne n'est bipé. Pouvez-vous imaginer que nos serveurs applicatifs soient juste... en train de guérir ?",
  "I think the rewrite is a couple of weeks. The pattern matching basically writes itself, and the parts that don't, a supervisor will restart.":
    "Je pense que la réécriture prend quelques semaines. La correspondance de modèles s'écrit essentiellement toute seule, et les parties qui ne le font pas, un superviseur redémarrera.",
  'With newfound serenity,\n{0}': 'Avec une sérénité retrouvée,\n{0}',
  'It ran phone switches. It can run us.':
    'Il faisait fonctionner des commutateurs téléphoniques. Cela peut nous diriger.',
  'The runtime under Elixir was built for telephone switches that were not allowed to go down. Our app servers go down when someone sneezes near them.':
    "Le temps d'exécution sous Elixir a été conçu pour les commutateurs téléphoniques qui n'étaient pas autorisés à tomber en panne. Nos serveurs applicatifs tombent en panne lorsque quelqu'un éternue à proximité.",
  "I'd like to rewrite them in Elixir. A sprint, maybe a sprint and a bit. It's mostly pipes and joy.":
    "J'aimerais les réécrire dans Elixir. Un sprint, peut-être un sprint et un peu. C'est surtout des pipes et de la joie.",
  "Review the migration if you're curious. Decline if you've heard enough. I'll still be humming, quietly, in a fault-tolerant way.":
    'Examinez la migration si vous êtes curieux. Refusez si vous en avez suffisamment entendu. Je continuerai de fredonner, doucement, de manière tolérante aux pannes.',
  'quick elixir thought': "pensée d'élixir rapide",
  'random thought at 1 a.m.:': 'pensée aléatoire à 1 heure du matin :',
  'what if the app servers were Elixir.': 'et si les serveurs applicatifs étaient Elixir.',
  'like, what if.': 'comme, et si.',
  "hot code reloading. deploys without restarts. i read the whole book tonight, so i'm basically an expert.":
    "rechargement de code à chaud. se déploie sans redémarrage. j'ai lu le livre en entier ce soir, donc je suis fondamentalement un expert.",
  'probably a week? the book was short.': 'probablement une semaine ? le livre était court.',
  'Review the migration if you want to hear the rest of the thought. Decline if you want me to go to sleep.':
    'Examinez la migration si vous voulez entendre le reste de la pensée. Refusez si vous voulez que je m’endorme.',
  Zig: 'Zig',
  "I've started writing Zig and I can see every allocation with my own eyes. It's like taking off foggy glasses I didn't know I was wearing.":
    "J'ai commencé à écrire Zig et je peux voir chaque allocation de mes propres yeux. C'est comme enlever des lunettes embuées que je ne savais pas que je portais.",
  'Review the migration to talk it over, or Decline.':
    'Examinez la migration pour en discuter, ou refusez.',
  'Explicitly yours,\n{0}': 'Explicitement vôtre,\n{0}',
  "That's the pitch. That's the whole word.": "C'est le pitch. C'est tout le mot.",
  "Fine, more: Zig, for the app servers. Manual memory, but friendly about it. I'll have it done before the next version of Zig comes out, which is soon, so I'd better start.":
    'Très bien, plus : Zig, pour les serveurs applicatifs. Mémoire manuelle, mais conviviale. Je le ferai avant la sortie de la prochaine version de Zig, ce qui est bientôt, donc je ferais mieux de commencer.',
  'Proposal: the app servers, but in Zig': 'Proposition : les serveurs applicatifs, mais en Zig',
  "I've been reading the Zig standard library for fun. Yes, for fun. It's very readable, which says something about the language and also about my evenings.":
    "J'ai lu la bibliothèque standard Zig pour m'amuser. Oui, pour le plaisir. C'est très lisible, ce qui en dit long sur la langue et aussi sur mes soirées.",
  "I'd like to propose a rewrite of the app servers in Zig. By my estimate it's mostly typing, and things that are mostly typing are quick.":
    "J'aimerais proposer une réécriture des serveurs applicatifs dans Zig. D'après mon estimation, il s'agit principalement de frappe, et les choses qui consistent principalement à taper sont rapides.",
  "If you'd like to see my plan (one page, with a diagram), review the migration. Otherwise, Decline.":
    'Si vous souhaitez voir mon plan (une page, avec un schéma), examinez la migration. Sinon, refusez.',
  'Thanks for reading,\n{0}': "Merci d'avoir lu,\n{0}",
  Haskell: 'Haskell',
  'What if the app servers were pure?': 'Et si les serveurs applicatifs étaient purs ?',
  "I've been learning Haskell, and I can't go back. Our app servers have side effects everywhere. In Haskell they'd live in a monad, where they belong, being watched.":
    "J'ai appris Haskell et je ne peux pas revenir en arrière. Nos serveurs applicatifs ont des effets secondaires partout. À Haskell, ils vivraient dans une monade, là où ils appartiennent, sous surveillance.",
  'The rewrite is quick once the types line up. The types always line up eventually. If it compiles, it works.':
    'La réécriture est rapide une fois les types alignés. Les types finissent toujours par s’aligner. Si ça compile, ça marche.',
  'Review the migration to discuss, or Decline.':
    'Examinez la migration pour en discuter ou refusez.',
  'A monad is just a monoid in the category of...':
    "Une monade n'est qu'un monoïde dans la catégorie des...",
  "I want to rewrite the app servers in Haskell. I'll explain monads in the planning meeting. It'll take ten minutes. The explanation, I mean. The rewrite will take, like, a sprint.":
    "Je souhaite réécrire les serveurs applicatifs dans Haskell. J'expliquerai les monades lors de la réunion de planification. Cela prendra dix minutes. L'explication, je veux dire. La réécriture prendra genre un sprint.",
  "Review the migration and I'll bring a whiteboard. Decline and I'll bring it anyway, just to stand next to.":
    'Examinez la migration et j’apporterai un tableau blanc. Refusez et je l’apporterai quand même, juste pour me tenir à côté.',
  'Lazily yours,\n{0}': 'Paresseusement vôtre,\n{0}',
  'Type-safe app servers: a proposal': "Serveurs d'applications de type sécurisé : une proposition",
  "I'm proposing we rewrite the app servers in Haskell.":
    'Je propose de réécrire les serveurs applicatifs dans Haskell.',
  'What we get: a type system that catches bugs before users do, and code that reads like mathematics.':
    'Ce que nous obtenons : un système de type qui détecte les bogues avant les utilisateurs et un code qui se lit comme des mathématiques.',
  "What it costs: less than you'd think. Most of the work is choosing the types, and I've already chosen most of them, in my head, on the bus.":
    "Ce que ça coûte : moins que vous ne le pensez. La majeure partie du travail consiste à choisir les types, et j'en ai déjà choisi la plupart, dans ma tête, dans le bus.",
  'Review the migration to go through it together, or Decline.':
    'Examinez la migration pour la parcourir ensemble, ou refusez.',
  '[Ticket #4096] "Is it supposed to be this slow?"':
    '[Ticket #4096] "Est-ce que c\'est censé être aussi lent ?"',
  'A customer opened a ticket via {0}:': 'Un client a ouvert un ticket via {0} :',
  "> Hi! Love the app. I clicked Save and then made a sandwich. It was still saving when I came back. It's a good sandwich. Is the app okay?":
    "> Salut ! J'adore l'application. J'ai cliqué sur Enregistrer, puis j'ai préparé un sandwich. C'était encore économisant à mon retour. C'est un bon sandwich. L'application est-elle correcte ?",
  'Priority: Normal\nStatus: Open\nSLA: we take your feedback seriously':
    'Priorité : Normale\nStatut : Ouvert\nSLA : nous prenons vos retours au sérieux',
  'This ticket will close automatically if nobody replies, which is how we resolve most things.':
    "Ce ticket se fermera automatiquement si personne ne répond, c'est ainsi que nous résolvons la plupart des problèmes.",
  'New conversation: "loading..."': 'Nouvelle conversation : "chargement..."',
  'New conversation from a customer:': "Nouvelle conversation d'un client :",
  "Customer: hi\nCustomer: is the page meant to load in stages\nCustomer: like a slideshow\nCustomer: i'm on slide 4\nBot: Thanks for reaching out! The team typically replies in a few minutes.\nCustomer: so does the page":
    "Client : bonjour\nClient : la page est-elle censée se charger par étapes\nClient : comme un diaporama\nClient : je suis sur la diapositive 4\nBot : Merci de nous avoir contactés ! L'équipe répond généralement en quelques minutes.\nClient : la page aussi",
  'The conversation is still open. The customer is still on slide 4.':
    'La conversation est toujours ouverte. Le client est toujours sur la diapositive 4.',
  "This week's top complaint: speed": 'La principale plainte de cette semaine : la vitesse',
  'Your weekly summary from {0}. One theme came up more than the rest: slowness.':
    'Votre résumé hebdomadaire de {0}. Un thème est revenu plus que les autres : la lenteur.',
  'A few highlights, lightly edited:\n- "I refreshed so many times my F5 key is shiny now."\n- "Fast enough to use, slow enough to resent."\n- "My grandma asked if the internet was broken. It wasn\'t. It was just your app."':
    'Quelques faits saillants, légèrement modifiés :\n- "J\'ai rafraîchi tellement de fois que ma touche F5 brille maintenant."\n- "Assez rapide pour être utilisé, assez lent pour être irrité."\n- "Ma grand-mère m\'a demandé si Internet était en panne. Ce n\'était pas le cas. C\'était juste votre application."',
  'We\'ve tagged these "performance" and "please".':
    "Nous les avons étiquetés « performance » et « s'il vous plaît ».",
  'Escalated: a customer is waiting at checkout': 'Escaladé : un client attend à la caisse',
  'This ticket has been escalated from tier 1 to tier 2, and from tier 2 to you.':
    'Ce ticket est passé du niveau 1 au niveau 2, et du niveau 2 à vous.',
  'Customer summary: a bakery owner who has been trying to give you money for a while. In their words: "I proofed a loaf of bread between clicking Pay and seeing the receipt. I\'d like to pay you. Please make it easier."':
    "Résumé client : un propriétaire de boulangerie qui essaie de vous donner de l'argent depuis un moment. Selon leurs mots : \"J'ai vérifié une miche de pain entre le clic sur Payer et l'affichage du reçu. J'aimerais vous payer. S'il vous plaît, rendez-le plus facile.\"",
  'Recommended response: make it faster.': 'Réponse recommandée : rendez-le plus rapide.',
  'Regards,\n{0} Escalations': 'Cordialement,\nEscalades {0}',
  'Ticket #8191 has been solved (it has not)': 'Le ticket n° 8191 a été résolu (il ne l’a pas été)',
  'Ticket #8191 from one of your customers was marked Solved after three days without a reply. We hope their issue was resolved!':
    'Le ticket n° 8191 d’un de vos clients a été marqué Résolu après trois jours sans réponse. Nous espérons que leur problème a été résolu !',
  "Original message, for the record:\n> The app is slow. Not broken, just slow, like it's thinking about each click very carefully. I appreciate thoughtfulness in people. Less so in apps.":
    "Message original, pour mémoire :\n> L'application est lente. Pas cassé, juste lent, comme s'il réfléchissait très attentivement à chaque clic. J'apprécie la prévenance des gens. Moins dans les applications.",
  'The customer may reopen the ticket, and probably will.':
    'Le client peut rouvrir le ticket et le fera probablement.',
  'We take your feedback seriously,\n{0}': 'Nous prenons vos commentaires au sérieux,\n{0}',
  'A very kind complaint': 'Une plainte très aimable',
  "Passing this one along from {0}. It's the nicest complaint we've had all month:":
    "En transmettant celui-ci de {0}. C'est la plus belle plainte que nous ayons eue tout le mois :",
  "> Hello! I don't want to be a bother. The app has gotten slow lately and I wondered if it was me. I restarted my router, my laptop, and my phone, twice. It's still slow. No rush! (A little rush.)":
    "> Bonjour ! Je ne veux pas être un ennui. L'application est devenue lente ces derniers temps et je me demandais si c'était moi. J'ai redémarré mon routeur, mon ordinateur portable et mon téléphone deux fois. C'est encore lent. Pas de précipitation ! (Un peu pressé.)",
  'Our dashboard says we typically reply in a few days. We suggest you reply sooner.':
    'Notre tableau de bord indique que nous répondons généralement dans quelques jours. Nous vous suggérons de répondre plus tôt.',
  'Warm regards,\n{0}': 'Cordialement,\n{0}',
  '{0}: users are leaving': '{0} : des utilisateurs partent',
  'Support queue: {0} is unhappy': 'File du support : mécontentement en {0}',
  'Cancellations from {0} are up. You have {1} users there, and you lose {2} an hour. At this rate you will have {3} tomorrow.':
    'Les résiliations augmentent en {0}. Vous y avez {1} utilisateurs et vous en perdez {2} par heure. À ce rythme, il vous en restera {3} demain.',
  'What they complain about most:': 'Ce dont ils se plaignent le plus :',
  '- {0}: {1}': '- {0} : {1}',
  '- nothing one cause explains': '- aucune cause unique ne l’explique',
  'The Churn breakdown lists every cause and the fix for each.':
    'L’analyse de l’attrition liste chaque cause et le correctif de chacune.',
  'The {0} queue doubled this hour. {1} users, down {2} an hour, {3} by this time tomorrow if nothing changes.':
    'La file {0} a doublé cette heure-ci. {1} utilisateurs, {2} de moins par heure, {3} demain à la même heure si rien ne change.',
  'Top tags:': 'Étiquettes principales :',
  'Open the Churn breakdown to see what wins them back.':
    'Ouvrez l’analyse de l’attrition pour voir ce qui les fera revenir.',
  'Open Churn breakdown': 'Ouvrir l’analyse de l’attrition',
  '{0} is growing again.': '{0} est de nouveau en croissance.',
  'slow from far away': 'lent depuis l’étranger',
  errors: 'erreurs',
  'not available at all': 'pas disponible du tout',
  'requests dropped': 'requêtes abandonnées',
  'connection refused': 'connexion refusée',
  'old data': 'données périmées',
  'crashes (out of memory)': 'plantages (mémoire saturée)',
  timeouts: 'délais dépassés',
  crashes: 'plantages',
  'blocked by the firewall': 'bloqué par le pare-feu',
  'a provider is down': 'un fournisseur est en panne',
  'rate limited': 'débit limité',
  'charged twice': 'débité deux fois',
}
