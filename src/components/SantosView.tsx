import React, { useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Heart, Shield, Award, ChevronLeft, Calendar, BookOpen } from "lucide-react";

export interface SantoItem {
  id: string;
  nome: string;
  subtitulo: string;
  tituloHonra: string;
  dataFesta: string;
  historiaCurta: string;
  historiaCompleta: string[];
  oracao: string;
  curiosidade?: string;
  corTema: "rose" | "amber" | "blue" | "emerald";
  imagemUrl?: string;
}

export const SANTOS_DATA: SantoItem[] = [
  {
    id: "santa_rita",
    nome: "Santa Rita de Cássia",
    subtitulo: "História",
    tituloHonra: "Padroeira das Causas Impossíveis e Desesperadas",
    dataFesta: "22 de Maio",
    imagemUrl: "/santa_rita_cassia.jpg",
    historiaCurta: "Rita nasceu por volta do ano de 1381 em Roccaporena, Itália. Foi modelo de humildade, paciência e bondade, vivendo o Evangelho a tal extremo que perdoou os assassinos de seu marido e ofereceu sua vida a Cristo.",
    historiaCompleta: [
      "Rita nasceu por volta do ano de 1381 em Roccaporena, uma aldeia situada na Prefeitura de Cássia na província de Perugia, filha de Antonio Lotti e Camata Ferri. Os seus pais eram pessoas de fé e a situação econômica não era das melhores, mas decorosa e tranquila.",
      "A história de Santa Rita foi repleta de eventos extraordinários e um destes se mostrou na sua infância. A criança, talvez deixada por alguns minutos sozinha em uma cesta na roça enquanto os seus pais trabalhavam na terra, foi circundada por um enxame de abelhas. Estes insetos recobriram a menina mas estranhamente não a picaram. Um camponês, que no mesmo momento havia ferido a mão com a enxada e estava correndo para ir curar-se, passou na frente da cesta onde estava deitada Rita. Viu as abelhas que rodeavam a criança, começou a mandá-las embora e com grande estupor, à medida que movia o braço, a ferida se cicatrizava completamente.",
      "Rita teria desejado ser monja, todavia ainda jovem (aos 13 anos) os pais, já idosos, a prometeram em casamento a Paulo Ferdinando Mancini, um homem conhecido pelo seu caráter iroso e brutal. Santa Rita, habituada ao dever não opôs resistência e se casou com o jovem oficial que comandava a guarnição de Collegiacone, presumivelmente entre os 17-18 anos, isto é, em torno aos anos 1387-1388.",
      "Do casamento entre Rita e Paulo nasceram dois filhos gêmeos: Giangiacomo Antonio e Paulo Maria, que tiveram todo o amor, a ternura e os cuidados da mãe. Rita conseguiu com o seu doce amor e tanta paciência transformar o caráter do marido, o fazendo ser mais dócil. Ela buscou educá-los na fé e no amor, dando sempre bom exemplo a eles.",
      "Rita passou por um grande sofrimento ao ver o marido assassinado e ao descobrir depois que os dois filhos pensavam em vingar a morte do pai. Com um amor heroico por suas almas, ela perdoou os assassinos e suplicou a Deus que levasse os filhos antes que cometessem esse grave pecado de vingança. Pouco tempo mais tarde, os dois rapazes morreram depois de preparar-se para o encontro com Deus.",
      "Sem o marido e filhos, Santa Rita entregou-se à oração, penitência e obras de caridade e tentou ser admitida no Convento Agostiniano em Cássia, fato que foi recusado no início. No entanto, ela não desistiu e manteve-se em oração, pedindo a intercessão de seus três santos patronos – São João Batista, Santo Agostinho e São Nicolau de Tolentino – e milagrosamente foi aceita no convento.",
      "Seu refúgio era Jesus Cristo. Rita quis ser religiosa: já era uma esposa santa, tornou-se uma viúva santa e depois uma religiosa exemplar. Ela recebeu um estigma na testa, que a acompanhou durante a vida e lhe permitiu compartilhar com Jesus as dores de Sua Paixão. A sua perseverança na oração a levava a passar até 15 dias correntes na cela 'sem falar com ninguém se não com Deus'.",
      "Cinco meses antes da morte de Rita, em pleno inverno rigoroso com um manto de neve cobrindo tudo, uma parente foi visitá-la e perguntou se desejava alguma coisa. Rita pediu uma rosa da sua horta em Roccaporena. Para grande surpresa, encontraram uma belíssima rosa florida na neve e a levaram a Rita, que foi assim denominada a Santa da 'Rosa' e dos Impossíveis.",
      "Antes de fechar os olhos para sempre, teve a visão de Jesus e da Virgem Maria que a convidavam ao Paraíso. Uma monja viu sua alma subir ao céu acompanhada de anjos enquanto os sinos da igreja tocaram sozinhos, um perfume suavíssimo se espalhou pelo Mosteiro e uma luz luminosa iluminou seu quarto. Era o dia 22 de Maio de 1447. Foi proclamada Santa após 453 anos de sua morte, inspirando-nos a viver o Evangelho: 'Amai-vos uns aos outros, como eu vos amei'."
    ],
    oracao: "Ó poderosa e gloriosa Santa Rita de Cássia, advogada das causas impossíveis e desesperadas, eis aos vossos pés uma alma desamparada que a vós recorre com fé e devoção. Alcançai-me de Deus a graça de que tanto necessito e, sobretudo, a fidelidade ao Evangelho, o perdão aos ofensores e a perseverança na oração e na caridade. Por Nosso Senhor Jesus Cristo. Amém. Santa Rita de Cássia, rogai por nós!",
    curiosidade: "O corpo incorrupto de Santa Rita de Cássia permanece preservado e exposto para veneração dos fiéis na Basílica de Cássia, na Itália. Até hoje, na festa de 22 de maio, a Igreja realiza a bênção solene das rosas em memória do milagre do inverno de Roccaporena.",
    corTema: "rose"
  },
  {
    id: "andre_soveral",
    nome: "Santo André de Soveral",
    subtitulo: "História",
    tituloHonra: "Protomártir do Brasil • Padre Diocesano",
    dataFesta: "03 de Outubro (Santos Mártires de Cunhaú e Uruaçu)",
    imagemUrl: "/santo_andre_soveral.jpg",
    historiaCurta: "André de Soveral nasceu em São Vicente em 1572 e foi discípulo do Padre José de Anchieta. Foi martirizado em 1645 durante a invasão holandesa enquanto celebrava a Santa Missa, junto com seus companheiros.",
    historiaCompleta: [
      "André de Soveral: André de Soveral nasceu em São Vicente, no dia 16 de julho de 1572, de pais portugueses, que lhe transmitiram sólidos ensinamentos cristãos. Deve ter sido batizado na Matriz de São Vicente Mártir, onde recebeu os primeiros Sacramentos e sua Primeira Comunhão. São Vicente foi a primeira cidade fundada no Brasil, em 1532, por Martim Afonso de Souza. Presume-se que André tenha sido aluno do Padre José de Anchieta, um dos primeiros Jesuítas a chegar à Terra de Santa Cruz, e que tenha estudado no 'Colégio Menino Jesus', fundado por Leonardo Nunes. No período da ação missionária de São José de Anchieta e Padre Manuel da Nóbrega, André partiu para o Nordeste, onde, em 1597, deu início à evangelização no Rio Grande do Norte, junto a outros missionários Jesuítas, provenientes do reino católico de Portugal. Por motivos desconhecidos, deixou a Companhia de Jesus, e se tornou Padre diocesano, em Natal.",
      "Missão em Cunhaú: No nordeste, Padre André trabalhou em Cunhaú, na Capela de Nossa Senhora das Candeias, nome do navio de Martim Afonso de Sousa, quando chegou às terras brasileiras. Na época, Cunhaú era um centro econômico de grande importância, por isso chamou a atenção dos holandeses. De fato, Cunhaú era um povoado de Canguaretama, no Rio Grande do Norte, que se formou em torno de um engenho de cana-de-açúcar, uma das riquezas da região, além de suas minas. Era uma espécie de expansão da produção paraibana e pernambucana na região do Norte, berço econômico da comunidade dos índios Potiguares.",
      "Tática dos Calvinistas: No dia 15 de julho de 1645, chegou a Cunhaú Jacó Rabe, um alemão a serviço do Supremo Conselho Holandês, com sede em Recife, que dizia ser portador de uma mensagem aos habitantes de Cunhaú. No dia seguinte, domingo, aproveitando a participação de um grande número de colonos da Missa, celebrada pelo pároco, Padre André de Soveral, Jacó Rabe mandou afixar na porta da igreja um edital, convocando todos a ouvir, após a celebração, as ordens do Supremo Conselho. Muitos compareceram, mas uma forte chuva, providencial, impediu que o número fosse maior. Sabe-se que os holandeses calvinistas, ao chegarem à região, restringiram a liberdade de culto dos católicos e os perseguiram, porque eram contra o Império Português no Brasil. Naquele domingo, 16 de julho de 1645, muitos fiéis, famílias e outros residentes, dirigiram-se à igrejinha de Nossa Senhora das Candeias. Naturalmente, para cumprir o preceito religioso, não portavam armas, proibidas pelas autoridades holandesas.",
      "Massacre em Cunhaú: O Padre André de Soveral começou a celebração Eucarística e, na hora da consagração, ao elevar a hóstia e o cálice, Jacó Rabe mandou fechar todas as portas da igreja. Naquele momento, deu-se início à terrível carnificina, com cenas de grande atrocidade: os fiéis em oração, inermes e indefesos, foram covardemente atacados e assassinados pelos flamengos, com a cumplicidade dos índios Tapuias e Potiguares. Sabendo o que ia acontecer, os fiéis não se rebelaram, pelo contrário, 'entre ânsias fatais, confessaram sua fé em Jesus Cristo, pedindo perdão de suas culpas'.",
      "O Martírio do Sacerdote: Enquanto o Padre André 'rezava, às pressas, o ofício da agonia', foi cruelmente atacado pelos Tapuias. No entanto, falando na língua dos indígenas, os exortava a não tocar a sua pessoa e tampouco a profanar as imagens e objetos do altar, para não cometer sacrilégio. Os Tapuias recuaram, mas os Potiguares não quiseram saber de sermões. Então, atacaram o ministro de Deus 'despedaçando seu corpo'. O principal autor do cruento assassinato foi o chefe dos Potiguares, Jererera, que, empunhando uma adaga, deu o golpe fatal ao sacerdote. Este foi o primeiro episódio do massacre dos Protomártires do Rio Grande do Norte.",
      "Massacre em Uruaçu: O segundo ataque, por parte dos holandeses Calvinistas e dos índios hostis aos Católicos, deu-se três meses depois, no dia 3 de outubro de 1645. Aterrorizados pelo que tinha acontecido em Cunhaú, os católicos de Natal procuravam fugir ou se esconder, inutilmente, em abrigos improvisados. Porém, foram pegos, junto com seu pároco, Padre Ambrósio Francisco Ferro, e levados para perto da cidade de Uruaçu, onde os soldados holandeses os aguardavam com cerca de duzentos índios. O pároco e seus fiéis foram brutalmente torturados e massacrados após bárbaras mutilações. Conforme os relatos da época, 'os índios arrancavam as entranhas e cortavam as cabeças, pernas e braços das suas vítimas'.",
      "Grupo dos Mártires e Canonização: Padre André de Soveral e seus 29 Companheiros mártires do Rio Grande do Norte foram sacrificados pela intolerância religiosa, pela perseguição contra a fé católica e a fé na Eucaristia. Padre André de Soveral, herói e mártir de Cunhaú, foi beatificado em 5 de março de 2000 e canonizado no dia 15 de outubro de 2017, na Praça de São Pedro, pelo Papa Francisco. A Igreja celebra, no dia 3 de outubro, a festa litúrgica dos Protomártires do Brasil: Padre André de Soveral, Padre Ambrósio Francisco Ferro, o leigo Mateus Moreira e outros 27 Companheiros mártires. (Fonte: Vatican News)"
    ],
    oracao: "Ó Deus de infinita bondade, que concedestes a Santo André de Soveral a graça de servir ao vosso altar com fervor e derramar seu sangue em testemunho da fé eucarística, dai-nos, por sua intercessão, a firmeza inabalável no Evangelho, a coragem de testemunhar o amor de Cristo em todas as provações e a devoção ardente à Santa Missa. Por Nosso Senhor Jesus Cristo, vosso Filho, na unidade do Espírito Santo. Amém. Santo André de Soveral, rogai por nós!",
    curiosidade: "Santo André de Soveral foi o primeiro Santo de São Vicente e discípulo do Padre José de Anchieta. Foi martirizado em 1645 durante a invasão holandesa enquanto celebrava a Santa Missa. Ao expirar, balbuciou em entrega a Deus sua fidelidade ao Santíssimo Sacramento.",
    corTema: "amber"
  },
  {
    id: "mateus_moreira",
    nome: "Beato Mateus Moreira",
    subtitulo: "História",
    tituloHonra: "Protomártir do Brasil • Patrono dos Ministros Extraordinários da Comunhão Eucarística",
    dataFesta: "03 de Outubro (Santos Mártires de Cunhaú e Uruaçu)",
    imagemUrl: "/mateus_moreira.jpg",
    historiaCurta: "No dia 03 de outubro a Igreja celebra a memória dos Protomártires do Brasil e dentre eles, o patrono dos Ministros Extraordinários da Comunhão Eucarística, o Beato Mateus Moreira.",
    historiaCompleta: [
      "Dia do Beato Mateus Moreira: No dia 03 de outubro a Igreja celebra a memória dos Protomártires do Brasil e dentre eles, o patrono dos Ministros Extraordinários da Comunhão Eucarística, o Beato Mateus Moreira. Para celebrar o seu dia, acontecerá na Catedral São Dimas a missa com os Ministros Extraordinários da Comunhão, às 19h30, presidida pelo assessor diocesano dos Ministros Extr. da Comunhão, Bênção e Consolo, Pe. Claudio César Costa.",
      "Conheça a história dos Protomártires do Brasil: Dentro da conturbada invasão dos holandeses no nordeste do Brasil, encontram-se os dois martírios coletivos: o de Cunhaú e o de Uruaçu. Estes martírios aconteceram no ano de 1645, sendo que o Pe. André de Soveral e Domingos de Carvalho foram mártires em Cunhaú e o Pe. Ambrósio Francisco Ferro e Mateus Moreira em Uruaçu; dentre outros.",
      "No Engenho de Cunhaú, principal pólo econômico da Capitania do Rio Grande (atual estado do Rio Grande do Norte), existia uma pequena e fervorosa comunidade composta por 70 pessoas sob os cuidados do Pe. André de Soveral. No dia 15 de julho chegou em Cunhaú Jacó Rabe, trazendo consigo seus liderados, os ferozes tapuias, e, além deles, alguns potiguares com o chefe Jerera e soldados holandeses. Jacó Rabe era conhecido por seus saques e desmandos, feitos com a conivência dos holandeses, deixando um rastro de destruição por onde passava.",
      "Dizendo-se em missão oficial pelo Supremo Conselho Holandês do Recife, convoca a população para ouvir as ordens do Conselho após a missa dominical no dia seguinte. Durante a Santa Missa, após a elevação da hóstia e do cálice, a um sinal de Jacó Rabe, foram fechadas todas as portas da igreja e se deu início à terrível carnificina: os fiéis em oração, tomados de surpresa e completamente indefesos, foram covardemente atacados e mortos pelos flamengos com a ajuda dos tapuias e dos potiguares.",
      "A notícia do massacre de Cunhaú espalhou-se por todo o Rio Grande e capitanias vizinhas, mesmo suspeitando dessa conivência do governo holandês, alguns moradores influentes pediram asilo ao comandante da Fortaleza dos Reis Magos. Assim, foram recebidos como hóspedes o vigário Pe. Ambrósio Francisco Ferro, Antônio Vilela, o Moço, Francisco de Bastos, Diogo Pereira e José do Porto. Os outros moradores, a grande maioria, não podendo ficar no Forte, assumiram a sua própria defesa, construindo uma fortificação na pequena cidade de Potengi, a 25 km de Fortaleza.",
      "Enquanto isso, Jacó Rabe prosseguia com seus crimes. Após passar por várias localidades do Rio Grande e da Paraíba, Rabe foi então à Potengi, e encontrou heróica resistência armada dos fortificados. Como sabiam que ele mandara matar os inocentes de Cunhaú, resistiram o mais que puderam, por 16 dias, até que chegaram duas peças de artilharia vindas da Fortaleza dos Reis Magos. Não tinham como enfrentá-las. Depuseram as armas e entregaram-se nas mãos de Deus.",
      "Cinco reféns foram levados à Fortaleza: Estêvão Machado de Miranda, Francisco Mendes Pereira, Vicente de Souza Pereira, João da Silveira e Simão Correia. Desse modo, os moradores do Rio Grande ficaram em dois grupos: 12 na Fortaleza e o restante sob custódia em Potengi.",
      "Dia 2 de outubro chegaram ordens de Recife mandando matar todos os moradores, o que foi feito no dia seguinte, 3 de outubro. Os holandeses decidiram eliminar primeiro os 12 da Fortaleza, por serem pessoas influentes, servindo de exemplo: o vigário, um escabino, um rico proprietário.",
      "Foram embarcados e levados rio acima para o porto de Uruaçu. Lá os esperava o chefe indígena potiguar Antônio Paraopaba e um pelotão armado de duzentos índios seus comandados. Repetiram-se então as piores atrocidades e barbáries, que os próprios cronistas da época sentiam pejo em contá-las, porque atentavam às leis da moral e modéstia.",
      "Mateus Moreira, estando ainda vivo, foi-lhe arrancado o coração pelas costas, mas ele ainda teve forças para proclamar a sua fé na Eucaristia, dizendo: “Louvado seja o Santíssimo Sacramento”.",
      "A 5 de março de 2000, na Praça de São Pedro, no Vaticano, o Papa João Paulo II beatificou os 30 protomártires brasileiros, sendo 2 sacerdotes e 28 leigos beatificados e em 2005, durante a 43ª Assembléia Geral dos Bispos do Brasil, realizada em Itaici – SP, foi comunicada a aprovação do Beato Mateus Moreira como “Patrono dos Ministros Extraordinários da Comunhão Eucarística”."
    ],
    oracao: "Senhor Jesus, a Eucaristia é o Sacramento por excelência do Mistério Pascal, do qual nasceu a Igreja, a tua Igreja. Por isso, a Eucaristia está sempre no centro da vida eclesial. Muito obrigado por me chamar a exercer, nesta Igreja, o ministério extraordinário da Sagrada Comunhão Eucarística. Ajuda-me a viver mais intensamente do mistério da Tua presença eucarística e conformar a minha vida ao Teu sacrifício. Ajuda-me a dedicar o máximo cuidado e reverência na administração da Sagrada Comunhão, para a glória de Deus e santificação dos irmãos e irmãs. Amém.",
    curiosidade: "A 5 de março de 2000, o Papa João Paulo II beatificou os 30 protomártires brasileiros. Em 2005, na 43ª Assembleia Geral dos Bispos do Brasil (Itaici – SP), foi aprovado o Beato Mateus Moreira como Patrono dos Ministros Extraordinários da Comunhão Eucarística.",
    corTema: "blue"
  },
  {
    id: "sao_tarcisio",
    nome: "São Tarcísio",
    subtitulo: "História",
    tituloHonra: "Mártir da Eucaristia • Padroeiro dos Coroinhas e Acólitos",
    dataFesta: "15 de Agosto",
    imagemUrl: "/sao_tarcisio.jpg",
    historiaCurta: "São Tarcísio é um menino santo que viveu por volta do ano 260. Ele é o padroeiro dos coroinhas, acólitos e cerimoniários na Igreja de Roma.",
    historiaCompleta: [
      "São Tarcísio é um menino santo. Tarcísio por volta do ano 260. Ele é o padroeiro dos coroinhas, acólitos e cerimoniários. Isso pelo fato de ele ter sido acólito (coroinha), aquela pessoa que ajuda o sacerdote nas missas e prestava seus serviços na Igreja de Roma.",
      "Perseguição: Durante a perseguição de Valeriano, imperador de Roma (253-260), muitos cristãos foram presos e martirizados. Enquanto estavam na prisão esperando a morte, esses cristãos desejavam receber a Santa Eucaristia para se fortalecerem com o Corpo de Cristo. Mas era muito difícil entrar nas cadeias com a Santa Comunhão.",
      "Um menino cheio de coragem: O Papa Sisto II queria, mas não podia levar a Eucaristia aos presos antes de serem mortos. Então, com apenas 12 anos de idade, Tarcísio se ofereceu para fazer este serviço. Ele dizia estar disposto a até mesmo dar a sua vida para que as hóstias sagradas não caíssem nas mãos dos pagãos. Mas o papa, olhando para ele, disse: 'És jovem ainda, Tarcísio, e não sabes desempenhar esta santa missão'. Tarcísio retrucou: 'Tanto melhor, porque de mim ninguém desconfiará, podendo de tal maneira me aproximar de nossos irmãos encarcerados. E também sei guardar as Santas Hóstias e nunca as entregarei aos pagãos.' Diante de tal atitude o papa não teve dúvida e entregou a ele uma caixa de prata com as Hóstias.",
      "Perseguição: E Tarcísio foi cumprir sua missão. Caminhava firme pelas ruas, quando outros meninos o chamaram para brincar, pois faltava um para completar a brincadeira. Tarcísio se desculpou, dizendo estar com pressa. Um rapaz pegou-o pelo braço e quis forçá-lo. Tarcísio resistiu. Então, perceberam que ele segurava algo. Curiosos perguntaram o que era. Não atendendo às suas exigências, tentaram arrancar o segredo de suas mãos. Uma pessoa que passava pelo local, vendo a confusão, disse: 'Ele leva o Deus dos cristãos!' Então, os rapazes caíram sobre o pobre menino para lhe arrancar à força as Santas Hóstias.",
      "Força sobrenatural: Tarcísio segurava com tanta firmeza o tesouro, que força alguma conseguiu arrancá-lo. Porém, eles espancaram e maltrataram Tarcísio sem piedade. Exausto e quase morto, segurava as Santas Hóstias com força sobrenatural. Bateram nele e o apedrejaram. E, mesmo desmaiado, já quase morto, São Tarcísio não soltou o corpo de Cristo em suas mãos. De repente, então, surgiu um soldado romano, que também era um cristão disfarçado, mas já era tarde demais. Tarcísio já estava quase morto. Mas, aí, movido pela força de Deus, o menino soltou o Corpo de Cristo, entregou a caixa de prata ao soldado e faleceu. Depois de morto, o soldado levou seu corpo para as catacumbas, onde Tarcísio foi sepultado.",
      "Veneração: Ainda é possível ver inscrições e restos arqueológicos sobre São Tarcísio nas famosas catacumbas de São Calisto. As inscrições comprovam a veneração a São Tarcísio. O Santo Papa Damaso I fez uma inscrição em seu túmulo, que diz: 'Enquanto um criminoso grupo de fanáticos se atirava sobre Tarcísio que levava a Eucaristia, o jovem preferiu perder a vida, antes que deixar aos raivosos o Corpo de Cristo'. Sua festa é celebrada no dia 15 de agosto."
    ],
    oracao: "Ó glorioso São Tarcísio, mártir da Eucaristia e padroeiro dos coroinhas e acólitos, que aos doze anos de idade destes a vida para proteger o Corpo do Senhor com força sobrenatural, dai a nós um amor ardente pelo Santíssimo Sacramento. Concedei a todos os ministros e acólitos a graça da santa coragem, da pureza de coração e do zelo inabalável pelo altar de Deus. Por Nosso Senhor Jesus Cristo, vosso Filho. Amém. São Tarcísio, rogai por nós!",
    curiosidade: "O diálogo de São Tarcísio com o Papa Sisto II aos 12 anos ('Tanto melhor, porque de mim ninguém desconfiará...') e sua resistência sobrenatural ao guardar a caixinha de prata com as hóstias sagradas tornaram-no modelo eterno de zelo eucarístico.",
    corTema: "emerald"
  }
];

interface SantosViewProps {
  onBack: () => void;
}

export const SantosView: React.FC<SantosViewProps> = ({ onBack }) => {
  const [selectedSanto, setSelectedSanto] = useState<SantoItem | null>(null);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">
      {/* Header da Tela (idêntico ao padrão de Orações e Liturgia) */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-blue-600 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              História dos Santos
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Paróquia Santa Rita de Cássia
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (selectedSanto) {
              setSelectedSanto(null);
            } else {
              onBack();
            }
          }}
          className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl border border-slate-200/60 shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <ChevronLeft className="w-4 h-4" />
          {selectedSanto ? "Voltar aos santos" : "Voltar ao início"}
        </button>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedSanto ? (
          <div className="space-y-6">
            {/* Grade de Ícones conforme o layout padrão de ícones do sistema */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 max-w-4xl mx-auto">
              {SANTOS_DATA.map((santo) => {
                const isMoreira = santo.id === "mateus_moreira";
                const isSoveral = santo.id === "andre_soveral";

                return (
                  <button
                    key={santo.id}
                    type="button"
                    onClick={() => setSelectedSanto(santo)}
                    className="flex flex-col items-center justify-center text-center p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl transition-all duration-200 relative border cursor-pointer hover:shadow-md hover:-translate-y-0.5 bg-white border-slate-200/80 shadow-xs group w-full"
                  >
                    {/* Imagem / Ícone em destaque, proporcional ao card e sem cortes */}
                    <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-slate-50 flex items-center justify-center mb-2.5 transition-transform duration-200 group-hover:scale-105 shadow-xs overflow-hidden border border-slate-100 p-1">
                      {santo.imagemUrl ? (
                        <img
                          src={santo.imagemUrl}
                          alt={santo.nome}
                          className="w-full h-full object-contain object-center rounded-xl"
                          referrerPolicy="no-referrer"
                        />
                      ) : isMoreira ? (
                        <Award className="w-10 h-10 stroke-[2] text-blue-600" />
                      ) : isSoveral ? (
                        <Shield className="w-10 h-10 stroke-[2] text-blue-600" />
                      ) : (
                        <Sparkles className="w-10 h-10 stroke-[2] text-blue-600" />
                      )}
                    </div>

                    {/* Nome do Santo */}
                    <span className="text-xs sm:text-sm font-black text-slate-900 leading-tight tracking-tight line-clamp-2 min-h-[32px] flex items-center justify-center px-1">
                      {santo.nome}
                    </span>

                    {/* Subtítulo HISTÓRIA em caixa alta como nos cards de exemplo */}
                    <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                      {santo.subtitulo}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-4 text-center text-xs text-slate-500 max-w-xl mx-auto">
              Toque em qualquer ícone acima para ler a biografia completa, o testemunho de fé e a oração.
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto py-2 space-y-6"
          >
            {/* Cabeçalho do Santo Selecionado */}
            <div className="text-center space-y-2.5">
              <div className="w-32 h-40 sm:w-40 sm:h-48 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center mx-auto shadow-md overflow-hidden p-1.5">
                {selectedSanto.imagemUrl ? (
                  <img
                    src={selectedSanto.imagemUrl}
                    alt={selectedSanto.nome}
                    className="w-full h-full object-contain object-center rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                ) : selectedSanto.id === "mateus_moreira" ? (
                  <Award className="w-12 h-12 stroke-[2] text-blue-600" />
                ) : selectedSanto.id === "andre_soveral" ? (
                  <Shield className="w-12 h-12 stroke-[2] text-blue-600" />
                ) : (
                  <Sparkles className="w-12 h-12 stroke-[2] text-blue-600" />
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {selectedSanto.nome}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-amber-700 uppercase tracking-wider">
                {selectedSanto.tituloHonra}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Festa Litúrgica: {selectedSanto.dataFesta}</span>
              </div>
            </div>

            {/* História Completa */}
            <div className="bg-slate-50/70 rounded-3xl p-6 sm:p-8 border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Biografia e Testemunho
                </h4>
              </div>
              <div className="space-y-3.5 text-slate-700 leading-relaxed text-sm sm:text-base">
                {selectedSanto.historiaCompleta.map((paragrafo, idx) => (
                  <p key={idx} className="text-justify font-normal">
                    {paragrafo}
                  </p>
                ))}
              </div>
            </div>

            {/* Curiosidade / Significado */}
            {selectedSanto.curiosidade && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs sm:text-sm text-amber-950 leading-relaxed">
                <span className="font-bold text-amber-900 block mb-1">
                  Você sabia?
                </span>
                {selectedSanto.curiosidade}
              </div>
            )}

            {/* Oração Oficial */}
            <div className="p-6 sm:p-8 rounded-3xl bg-blue-50/60 border border-blue-200/70 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-800">
                Oração Intercessória
              </span>
              <p className="text-slate-800 italic leading-relaxed text-sm sm:text-base font-serif">
                "{selectedSanto.oracao}"
              </p>
            </div>

            {/* Botão para voltar à lista de santos */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setSelectedSanto(null)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-wider text-xs hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar aos Santos
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default SantosView;
