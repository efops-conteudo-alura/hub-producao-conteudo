"use client";

import { useState } from "react";

type Role = "coordinator" | "instructor";

function CoordinatorGuide() {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <Step number={1} title="Fazer upload do curso">
        <p>Clique em <strong>+ Nova submissão</strong> e arraste o arquivo JSON do curso para a área de upload.</p>
        <p className="text-muted-foreground text-xs mt-1">O sistema aceita o JSON exportado do admin da Alura e o formato gerado pela ferramenta interna.</p>
      </Step>

      <Step number={2} title="Selecionar o instrutor">
        <p>Escolha um instrutor já cadastrado ou informe o nome e e-mail de um novo.</p>
        <p className="mt-1">O instrutor <strong>não precisa criar senha</strong>. Basta enviar para ele o link do Seletor — ao acessar com o e-mail cadastrado, ele já verá a tarefa atribuída.</p>
      </Step>

      <Step number={3} title="Aguardar a revisão">
        <p>Na lista de submissões, cada tarefa exibe seu status:</p>
        <ul className="mt-1.5 flex flex-col gap-1">
          <li className="flex items-center gap-2"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 shrink-0">aguardando</span> instrutor ainda não revisou</li>
          <li className="flex items-center gap-2"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 shrink-0">revisado</span> pronto para exportar</li>
          <li className="flex items-center gap-2"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 shrink-0">exportado</span> JSON gerado e/ou importado no admin</li>
        </ul>
      </Step>

      <Step number={4} title="Conferir e exportar">
        <ul className="flex flex-col gap-1 list-disc pl-4">
          <li>Clique numa submissão com status <strong>revisado</strong></li>
          <li>Veja o que o instrutor selecionou — alterações aparecem em verde, texto original riscado em vermelho</li>
          <li>Use <strong>Editar</strong> para ajustar um exercício, <strong>Excluir</strong> para removê-lo, ou <strong>+ Incluir na seleção</strong> para restaurar um que foi descartado</li>
          <li>Clique em <strong>⬇ Exportar JSON</strong> para baixar o arquivo final</li>
        </ul>
        <p className="text-muted-foreground text-xs mt-1">O arquivo exportado está no formato da plataforma Alura, pronto para importar no admin.</p>
      </Step>
    </div>
  );
}

function InstructorGuide() {
  return (
    <div className="flex flex-col gap-5 text-sm">
      <Step number={1} title="Ver suas tarefas">
        <p>As tarefas atribuídas a você aparecem nesta página. Clique em uma para começar.</p>
      </Step>

      <Step number={2} title="Selecionar as atividades">
        <p>Veja todas as atividades do curso, organizadas por aula. Marque o checkbox de cada atividade que deve ser incluída na versão final.</p>
        <p className="text-muted-foreground text-xs mt-1">Atividades de vídeo já foram removidas automaticamente.</p>
      </Step>

      <Step number={3} title="Revisar e comentar">
        <ul className="flex flex-col gap-1 list-disc pl-4">
          <li>Se quiser deixar um recado sobre alguma atividade, use o campo de comentário abaixo dela</li>
          <li>Você também pode editar o conteúdo de qualquer atividade — clique em <strong>Editar</strong> no card (o coordenador verá o que você mudou)</li>
        </ul>
      </Step>

      <Step number={4} title="Enviar">
        <p>Clique em <strong>Enviar seleção</strong>. O coordenador receberá sua seleção e cuidará do restante.</p>
        <p className="text-muted-foreground text-xs mt-1">Após o envio, a seleção fica bloqueada para edição da sua parte. Se precisar de alguma alteração, entre em contato com o coordenador.</p>
      </Step>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <p className="font-semibold text-foreground">{title}</p>
        <div className="text-foreground/70">{children}</div>
      </div>
    </div>
  );
}

export function GuideModal({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);

  const title = role === "coordinator" ? "Como usar o Seletor" : "Como funciona";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-muted-foreground hover:text-foreground border border-border hover:border-border/80 rounded-lg px-3 py-1.5 transition-colors"
      >
        Como funciona?
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-heading font-bold text-foreground">{title}</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none w-6 h-6 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              {role === "coordinator" ? <CoordinatorGuide /> : <InstructorGuide />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
