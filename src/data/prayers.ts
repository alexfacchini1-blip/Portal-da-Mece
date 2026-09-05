export interface Prayer {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  category: "diaria" | "mariana" | "espirito-santo" | "outras" | "mece";
}

export const prayers: Prayer[] = [
  {
    "id": "a-vossa-protecao",
    "title": "À Vossa Proteção",
    "content": "À Vossa Proteção recorremos, Santa Mãe de Deus. Não desprezeis as nossas súplicas em nossas necessidades, mas livrai-nos sempre de todos os perigos, ó Virgem gloriosa e bendita.",
    "category": "mariana"
  },
  {
    "id": "acto-de-caridade",
    "title": "Acto de Caridade",
    "content": "Meu Deus, porque sois infinitamente bom e digno de ser amado sobre todas as coisas, eu Vos amo de todo o meu coração, a exemplo de Jesus; e, por Vosso amor, amo também o meu próximo como a mim mesmo. Senhor, fazei que eu Vos ame cada vez mais. Ámen.",
    "category": "outras"
  },
  {
    "id": "acto-de-contricao",
    "title": "Acto de Contrição",
    "content": "Meu Deus, porque sois infinitamente bom e Vos amo de todo o meu coração, pesa-me de Vos ter ofendido e, com o auxílio da Vossa divina graça, proponho firmemente emendar-me e nunca mais Vos tornar a ofender. Peço e espero o perdão das minhas culpas pela Vossa infinita misericórdia. Ámen.",
    "category": "diaria"
  },
  {
    "id": "alma-de-cristo",
    "title": "Alma de Cristo",
    "content": "Alma de Cristo, santificai-me.  Corpo de Cristo, salvai-me.  Sangue de Cristo, inebriai-me.  Água do lado de Cristo, lavai-me  Paixão de Cristo, confortai-me.  Ó bom Jesus, ouvi-me.  Dentro das Vossas chagas, escondei-me.  Não permitais que eu me separe de Vós.  Do inimigo maligno defendei-me.  Na hora da minha morte, chamai-me.  Mandai-me ir para Vós,  Para que Vos louve com os Vossos Santos  Pelos séculos dos séculos. Ámen.",
    "category": "diaria"
  },
  {
    "id": "angelus--a-trindades-",
    "title": "Angelus (A Trindades)",
    "content": "V. O Anjo do Senhor anunciou a Maria R. E Ela concebeu pelo Espírito Santo  Avé Maria... V. Eis a escrava do Senhor. R. Faça-se em mim,  segundo a Vossa palavra.  Avé Maria... V. E o Verbo Divino encarnou. R. E habitou entre nós.  Avé Maria... V. Rogai por nós, santa Mãe de Deus. R. Para que sejamos dignos das promessas de Cristo Oremos. Infundi no nosso espírito a vossa graça, ó Pai; Vós que na anunciação do anjo nos revelastes a encarnação do vosso Filho, pela sua Paixão e Cruz, conduzi-nos à glória da ressurreição. Por Cristo, nosso Senhor.",
    "category": "mariana"
  },
  {
    "id": "ao-anjo-da-guarda",
    "title": "Ao Anjo da Guarda",
    "content": "Santo Anjo do Senhor,  meu zeloso guardador,  pois que a ti me confiou a Piedade divina,  hoje e sempre  me governa, rege, guarda e ilumina.  Ámen",
    "category": "diaria"
  },
  {
    "id": "ato-de-consagracao-ao-imaculado-coracao-de-maria",
    "title": "Ato de Consagração ao Imaculado Coração de Maria",
    "content": "Ó Maria, Mãe de Deus e nossa Mãe, recorremos a Vós nesta hora de tribulação. Vós sois Mãe, amais-nos e conheceis-nos: de quanto temos no coração, nada Vos é oculto. Mãe de misericórdia, muitas vezes experimentamos a vossa ternura providente, a vossa presença que faz voltar a paz, porque sempre nos guiais para Jesus, Príncipe da paz. Mas perdemos o caminho da paz. Esquecemos a lição das tragédias do século passado, o sacrifício de milhões de mortos nas guerras mundiais. Descuidamos os compromissos assumidos como Comunidade das Nações e estamos a atraiçoar os sonhos de paz dos povos e as esperanças dos jovens. Adoecemos de ganância, fechamo-nos em interesses nacionalistas, deixamo-nos ressequir pela indiferença e paralisar pelo egoísmo. Preferimos ignorar Deus, conviver com as nossas falsidades, alimentar a agressividade, suprimir vidas e acumular armas, esquecendo-nos que somos guardiões do nosso próximo e da própria casa comum. Dilaceramos com a guerra o jardim da Terra, ferimos com o pecado o coração do nosso Pai, que nos quer irmãos e irmãs. Tornamo-nos indiferentes a todos e a tudo, exceto a nós mesmos. E, com vergonha, dizemos: perdoai-nos, Senhor! Na miséria do pecado, das nossas fadigas e fragilidades, no mistério de iniquidade do mal e da guerra, Vós, Mãe Santa, lembrai-nos que Deus não nos abandona, mas continua a olhar-nos com amor, desejoso de nos perdoar e levantar novamente. Foi Ele que Vos deu a nós e colocou no vosso Imaculado Coração um refúgio para a Igreja e para a humanidade. Por bondade divina, estais connosco e conduzis-nos com ternura mesmo nos transes mais apertados da história. Por isso recorremos a Vós, batemos à porta do vosso Coração, nós os vossos queridos filhos que não Vos cansais de visitar em todo o tempo e convidar à conversão. Nesta hora escura, vinde socorrer-nos e consolar-nos. Repeti a cada um de nós: «Não estou porventura aqui Eu, que sou tua mãe?» Vós sabeis como desfazer os emaranhados do nosso coração e desatar os nós do nosso tempo. Repomos a nossa confiança em Vós. Temos a certeza de que Vós, especialmente no momento da prova, não desprezais as nossas súplicas e vindes em nosso auxílio. Assim fizestes em Caná da Galileia, quando apressastes a hora da intervenção de Jesus e introduzistes no mundo o seu primeiro sinal. Quando a festa se mudara em tristeza, dissestes-Lhe: «Não têm vinho!» (Jo 2, 3). Ó Mãe, repeti-o mais uma vez a Deus, porque hoje esgotamos o vinho da esperança, desvaneceu-se a alegria, diluiu-se a fraternidade. Perdemos a humanidade, malbaratamos a paz. Tornamo-nos capazes de toda a violência e destruição. Temos necessidade urgente da vossa intervenção materna. Por isso acolhei, ó Mãe, esta nossa súplica: Vós, estrela do mar, não nos deixeis naufragar na tempestade da guerra; Vós, arca da nova aliança, inspirai projetos e caminhos de reconciliação; Vós, «terra do Céu», trazei de volta ao mundo a concórdia de Deus; Apagai o ódio, acalmai a vingança, ensinai-nos o perdão; Libertai-nos da guerra, preservai o mundo da ameaça nuclear; Rainha do Rosário, despertai em nós a necessidade de rezar e amar; Rainha da família humana, mostrai aos povos o caminho da fraternidade; Rainha da paz, alcançai a paz para o mundo. O vosso pranto, ó Mãe, comova os nossos corações endurecidos. As lágrimas, que por nós derramastes, façam reflorescer este vale que o nosso ódio secou. E, enquanto o rumor das armas não se cala, que a vossa oração nos predisponha para a paz. As vossas mãos maternas acariciem quantos sofrem e fogem sob o peso das bombas. O vosso abraço materno console quantos são obrigados a deixar as suas casas e o seu país. Que o vosso doloroso Coração nos mova à compaixão e estimule a abrir as portas e cuidar da humanidade ferida e descartada. Santa Mãe de Deus, enquanto estáveis ao pé da cruz, Jesus, ao ver o discípulo junto de Vós, disse-Vos: «Eis o teu filho!» (Jo 19, 26). Assim Vos confiou cada um de nós. Depois disse ao discípulo, a cada um de nós: «Eis a tua mãe!» (19, 27). Mãe, agora queremos acolher-Vos na nossa vida e na nossa história. Nesta hora, a humanidade, exausta e transtornada, está ao pé da cruz convosco. E tem necessidade de se confiar a Vós, de se consagrar a Cristo por vosso intermédio. O povo ucraniano e o povo russo, que Vos veneram com amor, recorrem a Vós, enquanto o vosso Coração palpita por eles e por todos os povos ceifados pela guerra, a fome, a injustiça e a miséria. Por isso nós, ó Mãe de Deus e nossa, solenemente confiamos e consagramos ao vosso Imaculado Coração nós mesmos, a Igreja e a humanidade inteira, de modo especial a Rússia e a Ucrânia. Acolhei este nosso ato que realizamos com confiança e amor, fazei que cesse a guerra, providenciai ao mundo a paz. O sim que brotou do vosso Coração abriu as portas da história ao Príncipe da Paz; confiamos que mais uma vez, por meio do vosso Coração, virá a paz. Assim a Vós consagramos o futuro da família humana inteira, as necessidades e os anseios dos povos, as angústias e as esperanças do mundo. Por vosso intermédio, derrame-se sobre a Terra a Misericórdia divina e o doce palpitar da paz volte a marcar as nossas jornadas. Mulher do sim, sobre Quem desceu o Espírito Santo, trazei de volta ao nosso meio a harmonia de Deus. Dessedentai a aridez do nosso coração, Vós que «sois fonte viva de esperança». Tecestes a humanidade para Jesus, fazei de nós artesãos de comunhão. Caminhastes pelas nossas estradas, guiai-nos pelas sendas da paz. Amen.",
    "category": "outras"
  },
  {
    "id": "ave-maria",
    "title": "Avé Maria",
    "content": "Avé Maria, cheia de graça,  o Senhor é convosco,  bendita sois vós entre as mulheres  e bendito é o fruto do vosso ventre, Jesus.  Santa Maria, Mãe de Deus,  rogai por nós pecadores,  agora e na hora da nossa morte. Ámen",
    "category": "mariana"
  },
  {
    "id": "benedictus",
    "title": "Benedictus",
    "content": "Bendito o Senhor Deus de Israel  que visitou e redimiu o seu povo,  e nos deu um Salvador poderoso  na casa de David, seu servo,  conforme prometeu pela boca  dos seus santos,  os profetas dos tempos antigos,  para nos libertar dos nossos inimigos,  e das mãos daqueles que nos odeiam.  Para mostrar a sua misericórdia a favor dos nossos pais,  recordando a sua sagrada aliança,  e o juramento que fizera a Abraão,  nosso pai,  que nos havia de conceder esta graça:  de O servirmos um dia, sem temor,  livres das mãos dos nossos inimigos,  em santidade e justiça, na sua presença,  todos os dias da nossa vida.  E tu, menino, serás chamado profeta  do Altíssimo,  porque irás à sua frente a preparar os seus caminhos,  para dar a conhecer ao seu povo a salvação  pela remissão dos seus pecados,  graças ao coração misericordioso  do nosso Deus,  que das alturas nos visita  como sol nascente,  para iluminar os que jazem nas trevas  e na sombra da morte  e dirigir os nossos passos no caminho da paz.  Glória ao Pai e ao Filho  e ao Espírito Santo.  Como era no princípio,  agora e sempre. Ámen.",
    "category": "diaria"
  },
  {
    "id": "comunhao-spiritual",
    "title": "Comunhão espiritual",
    "content": "Meu Jesus, Eu creio que estais presente no Santíssimo Sacramento do Altar. Amo-vos sobre todas as coisas, e minha alma suspira por Vós. Mas como não posso receber-Vos agora no Santíssimo Sacramento, vinde, ao menos espiritualmente, ao meu coração. Abraço-me convosco como se já estivésseis comigo: uno-me Convosco inteiramente. Ah! Não permitais que torne a Separar-me de vós! (Santo Afonso Maria de Ligório)   Aos vossos pés, ó meu Jesus, me prostro e vos ofereço o arrependimento do meu coração que mergulha no seu nada na Vossa santa presença Eu vos adoro no Sacramento do vosso amor, a inefável Eucaristia. Desejo receber-vos na pobre morada que meu coração vos oferece. À espera da felicidade da comunhão sacramental, quero possuir-vos em Espírito. Vinde a mim, ó meu Jesus, que eu venha a vós. Que o vosso amor Possa inflamar todo o meu ser, para a vida e para a morte. Creio em vós, espero em vós. Amo-vos. Assim seja. (Card. Rafael Merry del Val)",
    "category": "outras"
  },
  {
    "id": "simbolo-dos-apostolos",
    "title": "Credo",
    "content": "Símbolo dos Apóstolos Creio em Deus, Pai todo-poderoso, Criador do Céu e da Terra E em Jesus Cristo, seu único Filho, nosso Senhor que foi concebido pelo poder do Espírito Santo; nasceu da Virgem Maria;  padeceu sob Pôncio Pilatos,  foi crucificado, morto e sepultado;  desceu à mansão dos mortos;  ressuscitou ao terceiro dia;  subiu aos Céus;  está sentado à direita de Deus Pai todo-poderoso,  de onde há-de vir a julgar os vivos e os mortos. Creio no Espírito Santo;  na santa Igreja Católica;  na comunhão dos Santos;  na remissão dos pecados;  na ressurreição da carne;  e na vida eterna. Ámen   Símbolo Niceno-Constantinopolitano Creio em um só Deus, Pai todo-poderoso, Criador do céu e da terra De todas as coisas visíveis e invisíveis. Creio em um só Senhor, Jesus Cristo, Filho Unigênito de Deus, nascido do Pai antes de todos os séculos: Deus de Deus, Luz da Luz, Deus verdadeiro de Deus verdadeiro. Gerado, não criado, consubstancial ao Pai. Por Ele todas as coisas foram feitas, E por nós, homens, e para nossa salvação desceu dos céus E encarnou pelo Espírito Santo, no seio da Virgem Maria, e Se fez homem. Também por nós foi crucificado sob Pôncio Pilatos, padeceu e foi sepultado. Ressuscitou ao terceiro dia, conforme as Escrituras, e subiu aos céus, onde está sentado à direita do Pai. De novo há-de vir em sua glória, para julgar os vivos e os mortos, e o seu reino não terá fim. Creio no Espírito Santo, Senhor que dá a vida, e procede do Pai e do Filho, e com o Pai e o Filho, é adorado e glorificado: Ele que falou pelos Profetas. Creio na Igreja una, santa, católica e apostólica. Professo um só batismo Para remissão dos pecados. E espero a ressurreição dos mortos, e vida do mundo que há-de vir. Ámen",
    "category": "diaria"
  },
  {
    "id": "dai-lhes--senhor--o-eterno-descanso",
    "title": "Dai-lhes, Senhor, o eterno descanso",
    "content": "Dai-lhes, Senhor, o eterno descanso  Entre os esplendores da luz perpétua.  Descansem em paz. Ámen",
    "category": "outras"
  },
  {
    "id": "gloria-ao-pai",
    "title": "Glória ao Pai",
    "content": "Glória ao Pai e ao Filho  e ao Espírito Santo.  Como era, no princípio,  agora e sempre.  Ámen.",
    "category": "diaria"
  },
  {
    "id": "lembrai-vos",
    "title": "Lembrai-vos",
    "content": "Lembrai-vos, ó puríssima Virgem Maria,  que nunca se ouviu dizer que algum  daqueles que tenha recorrido à Vossa protecção,  implorado a Vossa assistência e reclamado o Vosso socorro,  fosse por Vós desamparado. Animado eu, pois, de igual confiança,  a Vós, Virgem entre todas singular,  como a Mãe recorro, de Vós me valho,  e, gemendo sob o peso dos meus pecados,  me prostro aos Vossos pés.  Não desprezeis as minhas súplicas,  ó Mãe do Filho de Deus humanado,  mas dignai- Vos de as ouvir propícia  e de me alcançar o que Vos rogo. Ámen",
    "category": "mariana"
  },
  {
    "id": "magnificat",
    "title": "Magnificat",
    "content": "A minha alma glorifica ao Senhor  e o meu espírito se alegra em Deus, meu Salvador.  Porque pôs os olhos na humildade da sua serva:  de hoje em diante me chamarão bem-aventurada todas as gerações.  O Todo-Poderoso fez em mim maravilhas:  Santo é o seu nome.  A sua misericórdia se estende de geração em geração  sobre aqueles que O temem.  Manifestou o poder do seu braço  e dispersou os soberbos.  Derrubou os poderosos de seus tronos  e exaltou os humildes.  Aos famintos encheu de bens  e aos ricos despediu de mãos vazias.  Acolheu Israel seu servo,  lembrado da sua misericórdia,  como tinha prometido a nossos pais,  a Abraão e à sua descendência  para sempre.  Glória ao Pai e ao Filho  e ao Espírito Santo.  Como era no princípio, agora e sempre.  Ámen.",
    "category": "mariana"
  },
  {
    "id": "oracao-a-sagrada-familia",
    "title": "Oração à Sagrada Família",
    "content": "Jesus, Maria e José, em Vós contemplamos o esplendor do verdadeiro amor, confiantes, a Vós nos consagramos. Sagrada Família de Nazaré, tornai também as nossas famílias lugares de comunhão e cenáculos de oração, autênticas escolas do Evangelho e pequenas igrejas domésticas. Sagrada Família de Nazaré, que nunca mais haja nas famílias episódios de violência, de fechamento e divisão; e quem tiver sido ferido ou escandalizado seja rapidamente consolado e curado. Sagrada Família de Nazaré, fazei que todos nos tornemos conscientes do carácter sagrado e inviolável da família, da sua beleza no projecto de Deus. Jesus, Maria e José, ouvi-nos e acolhei a nossa súplica. Ámen. (Papa Francisco, Amoris Laetitia, 325)",
    "category": "outras"
  },
  {
    "id": "oracao-a-sao-jose",
    "title": "Oração a São José",
    "content": "Salve, guardião do Redentor e esposo da Virgem Maria! A vós, Deus confiou o seu Filho; em vós, Maria depositou a sua confiança; convosco, Cristo tornou-Se homem. Ó Bem-aventurado José, mostrai-vos pai também para nós e guiai-nos no caminho da vida. Alcançai-nos graça, misericórdia e coragem, e defendei-nos de todo o mal. Amen. (Papa Francisco, Patris Corde)",
    "category": "outras"
  },
  {
    "id": "pai-nosso",
    "title": "Pai Nosso",
    "content": "Pai Nosso que estais nos Céus,  santificado seja o vosso Nome,  venha a nós o vosso Reino,  seja feita a vossa vontade  assim na terra como no Céu.  O pão nosso de cada dia nos dai hoje,  perdoai-nos as nossas ofensas  assim como nós perdoamos  a quem nos tem ofendido,  e não nos deixeis cair em tentação,  mas livrai-nos do Mal.",
    "category": "diaria"
  },
  {
    "id": "rainha-do-ceu-",
    "title": "Rainha do Céu",
    "content": "Rainha dos céus, alegrai-vos. Aleluia!  Porque Aquele que merecestes trazer em vosso seio. Aleluia!  Ressuscitou como disse. Aleluia!  Rogai por nós a Deus. Aleluia!  D./ Alegrai-vos e exultai, ó Virgem Maria. Aleluia!  C./ Porque o Senhor ressuscitou, verdadeiramente. Aleluia! Ó Deus, que na gloriosa ressurreição do vosso Filho, restituístes a alegria ao mundo inteiro, pela intercessão da Virgem Maria, concedei-nos gozar a alegria da vida eterna. Por Cristo, nosso Senhor. Amém",
    "category": "mariana"
  },
  {
    "id": "rosario",
    "title": "Rosário",
    "content": "Mistérios Gozosos  (Segundas e Sábados) A anunciação do Anjo à Virgem Maria.  A visita de Maria a Santa Isabel.  O nascimento de Jesus em Belém.  A apresentação de Jesus no Templo.  A perda e encontro de Jesus no Templo. Mistérios da Luz  (Quintas Feiras) O baptismo de Jesus no Jordão.  A auto-revelação de Jesus nas bodas de Caná.  O anúncio do Reino e o convite à conversão.  A transfiguração de Jesus no Tabor.  A instituição da Eucaristia. Mistérios Dolorosos  (Terças e Sextas) Agonia de Jesus no Horto das Oliveiras.  Flagelação de Jesus, preso à coluna.  Coroação de espinhos.  Jesus carrega a cruz a caminho do Calvário.  Jesus é crucificado e morre na cruz. Mistérios Gloriosos  (Quartas e Domingo ) A ressurreição de Jesus.  A ascensão de Jesus ao céu.  A descida do Espírito Santo.  A assunção da Santíssima Virgem ao céu.  A coroação de Nossa Senhora,  como Rainha do céu e da terra. Senhor nosso Deus, concede aos teus fiéis, a graça de gozarem sempre da saúde do corpo e do espírito, pela gloriosa intercessão de Maria Santíssima, sempre Virgem, salva-nos dos males que agora nos afligem e guia-nos para uma alegria sem fim. Por Cristo, nosso Senhor.",
    "category": "outras"
  },
  {
    "id": "salve-rainha",
    "title": "Salve Rainha",
    "content": "Salve, Rainha,  mãe de misericórdia,  vida, doçura, esperança nossa, salve!  A Vós bradamos,  os degredados filhos de Eva.  A Vós suspiramos, gemendo e chorando  neste vale de lágrimas.  Eia, pois, advogada nossa,  esses Vossos olhos misericordiosos  a nós volvei.  E, depois deste desterro,  nos mostrai Jesus, bendito fruto  do Vosso ventre.  Ó clemente, ó piedosa,  ó doce Virgem Maria.  Rogai por nós, Santa Mãe de Deus,  para que sejamos dignos das promessas de Cristo.",
    "category": "mariana"
  },
  {
    "id": "sao-miguel-arcanjo",
    "title": "São Miguel Arcanjo",
    "content": "São Miguel Arcanjo, defendei-nos no combate. Sede o nosso refúgio contra as maldades e ciladas do demônio. Que Deus manifeste o seu poder sobre ele. Eis a nossa humilde súplica. E vós, Príncipe da Milícia Celeste, com o poder que Deus vos conferiu, precipitai no inferno Satanás e os outros espíritos malignos, que andam pelo mundo tentando as almas. Amém.",
    "category": "outras"
  },
  {
    "id": "te-deum",
    "title": "Te Deum",
    "content": "Nós Vos louvamos, ó Deus,  nós Vos bendizemos, Senhor.  Toda a terra Vos adora,  Pai eterno e omnipotente.  Os Anjos, os Céus  e todas as Potestades,  os Querubins e os Serafins  Vos aclamam sem cessar:  Santo, Santo, Santo,  Senhor Deus do Universo,  o céu e a terra proclamam a vossa glória.  O coro glorioso dos Apóstolos,  a falange venerável dos Profetas,  o exército resplandecente dos Mártires  cantam os vossos louvores.  A santa Igreja anuncia por toda a terra  a glória do vosso nome:  Deus de infinita majestade,  Pai, Filho e Espírito Santo.  Senhor Jesus Cristo, Rei da glória,  Filho do Eterno Pai,  para salvar o homem, tomastes  a condição humana no seio da Virgem Maria.  Vós despedaçastes as cadeias da morte  e abristes as portas do céu.  Vós estais sentado à direita de Deus,  na glória do Pai,  e de novo haveis de vir para julgar  os vivos e os mortos.  Socorrei os vossos servos, Senhor,  que remistes com vosso Sangue precioso; e recebei-os na luz da glória,  na assembleia dos vossos Santos.  Salvai o vosso povo, Senhor,  e abençoai a vossa herança;  sede o seu pastor e guia através dos tempos  e conduzi-o às fontes da vida eterna.  Nós Vos bendiremos todos os dias da nossa vida  e louvaremos para sempre o vosso nome.  Dignai-Vos, Senhor, neste dia, livrar-nos do pecado.  Tende piedade de nós,  Senhor, tende piedade de nós.  Desça sobre nós a vossa misericórdia,  Porque em Vós esperamos.  Em Vós espero, meu Deus,  não serei confundido eternamente.",
    "category": "outras"
  },
  {
    "id": "terco-da-divina-misericordia",
    "title": "Terço da Divina Misericórdia",
    "content": "Para rezar a o Terço da Divina Misericórdia pode-se usar um terço normal. Seguir a sequência abaixo: 1. Sinal da Cruz 2. Pai Nosso 3. Ave Maria 4. Credo (Símbolo dos Apóstolos) 5. Nas contas maiores do Terço, ao rezar o Pai Nosso reza-se: Eterno Pai, eu Vos ofereço o Corpo e Sangue, a Alma e Divindade de Vosso diletíssimo Filho, Nosso Senhor Jesus Cristo, em expiação dos nossos pecados e do mundo inteiro. 6. Nas contas menores do Terço, ao rezar a Ave Maria, reza-se: Pela Sua dolorosa Paixão, tende misericórdia de nós e do mundo inteiro. 7. Invocação. No final do terço, reza-se por três vezes: Deus Santo, Deus Forte, Deus Imortal, tende piedade de nós e do mundo inteiro. 8. Oração conclusiva (opcional) Deus, Pai Misericordioso, que revelou Teu amor em Teu Filho Jesus Cristo, e o derramou sobre nós no Espírito Santo, confiamos-Te hoje o destino do mundo e de cada homem. Dobre-se sobre nós pecadores, cure nossa fraqueza, vença todo o mal, deixe que todos os habitantes da Terra experimentem a Tua misericórdia, para que em Ti, o Deus Trino, possam sempre encontrar a fonte da esperança. Pai Eterno, pela dolorosa Paixão e Ressurreição de Teu Filho, tende piedade de nós e do mundo inteiro. Amém.",
    "category": "outras"
  },
  {
    "id": "vem--espirito-santo",
    "title": "Vem, Espírito Santo",
    "content": "Vinde, ó santo Espírito,  vinde Amor ardente,  acendei na terra vossa luz fulgente.  Vinde, Pai dos pobres:  na dor e aflições,  vinde encher de gozo  nossos corações.  Benfeitor supremo  em todo o momento,  habitando em nós  sois o nosso alento.  Descanso na luta  e na paz encanto,  no calor sois brisa,  conforto no pranto.  Luz de santidade,  que no Céu ardeis,  abrasai as almas  dos vossos fiéis,  Sem a vossa força  e favor clemente,  nada há no homem  que seja inocente.  Lavai nossas manchas,  a aridez regai,  sarai os enfermos  e a todos salvai.  Abrandai durezas  para os caminhantes,  animai os tristes,  guiai os errantes.  Vossos sete dons  concedei à alma  do que em Vós confia:  Virtude na vida,  amparo na morte,  no Céu alegria.",
    "category": "espirito-santo"
  },
  {
    "id": "veni-creator-spiritus",
    "title": "Veni Creator Spiritus",
    "content": "Vinde Espírito Criador, a nossa alma visitai e enchei os corações com vossos dons celestiais. Vós sois chamado o Intercessor de Deus excelso dom sem par, a fonte viva, o fogo, o amor, a unção divina e salutar. Sois o doador dos sete dons e sois poder na mão do Pai, por Ele prometido a nós, por nós seus feitos proclamai. A nossa mente iluminai, os corações enchei de amor, nossa fraqueza encorajai, qual força eterna e protetor. Nosso inimigo repeli, e concedei-nos a vossa paz, se pela graça nos guiais, o mal deixamos para trás. Ao Pai e ao Filho Salvador, por vós possamos conhecer que procedeis do Seu amor, fazei-nos sempre firmes crer. Amém!",
    "category": "espirito-santo"
  },
  {
    "id": "oracao-do-ministro-extraordinario-comunhao",
    "title": "Oração do Ministro Extraordinário da Comunhão",
    "subtitle": "Compromisso e Entrega",
    "content": "Senhor: A Igreja me confiou O Ministério Extraordinário da Sagrada Comunhão. Constituiu-me servidor da comunidade, em Assembléia Litúrgica, que compartilha a mesa fraternal da Comunhão, na consolação dos enfermos, anciãos e impedidos para que se fortaleçam com o Pão da Vida.\n\nEu sei, Senhor, que é, em primeiro lugar, um serviço. Porém, intimamente, o descubro como uma honra: Por meu intermédio, e através de minhas mãos, faço possível a comum-união de meus irmãos Contigo, no Sacramento do teu Corpo e do teu Sangue.\n\nPor isso, Senhor, consagro-te meus lábios que te anunciam, minhas mãos que te entregam; consagro-te meu ser, meu corpo e meu coração para ser tua testemunha leal. Não quero, Senhor, Que minha vida seja um obstáculo entre meus irmãos e teu mistério. Quero ser uma ponte, quero ser como duas mãos estendidas…\n\nPeço tua ajuda, de modo que eu seja um cristão de verdade, um cristão ansioso de tua Palavra, uma pessoa de oração e de reflexão, um contemplativo de teus mistérios; um celebrante feliz de teus Sacramentos e um servidor humilde de todos os meus irmãos. Que quando eu disser: “O Corpo de Cristo”, eu desapareça e se veja teu rosto. Amém.",
    "category": "mece"
  }
];
