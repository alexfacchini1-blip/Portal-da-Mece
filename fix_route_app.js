import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf8');

const routeContent = `
  if (view === "lider_painel") {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <BackgroundLogo paroquia={user?.paroquia} />
        <div className="relative z-10">
          <LiderView
            user={viewAsUser || user}
            myAssignments={myAssignments}
            voltar={() => setView("welcome")}
            onAlert={handleAlert}
          />
        </div>
        {renderModal()}
      </div>
    );
  }

  if (view === "mensagem") {`;

content = content.replace(/if \(view === "mensagem"\) \{/, routeContent);

fs.writeFileSync('src/App.tsx', content);
console.log('done');
