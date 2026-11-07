// --- 1. LÓGICA DA GALERIA DE FOTOS (CARROSSEL) ---
const galleryStates = { 'galeria-solteiro': 0, 'galeria-casal': 0 };

function moveGallery(id, direction) {
    const container = document.getElementById(id);
    const track = container.querySelector('.gallery-track');
    const slides = container.querySelectorAll('.gallery-slide');
    const totalSlides = slides.length;

    galleryStates[id] = (galleryStates[id] + direction + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${galleryStates[id] * 100}%)`;
}

// --- 2. CONTROLE DO FORMULÁRIO EM ETAPAS (WIZARD) ---
function nextStep(stepNumber) {
    // Validações ao avançar da Etapa 1 para a Etapa 2
    if (stepNumber === 2) {
        const nome = document.getElementById('nome').value.trim();
        const cpf = document.getElementById('cpf').value.trim();
        if (!nome || !cpf) {
            alert('Por favor, preencha o Nome e o CPF antes de prosseguir.');
            return;
        }
        if (cpf.length < 14) {
            alert('Por favor, insira um CPF válido.');
            return;
        }
    }
    
    // Validações ao avançar da Etapa 2 para a Etapa 3
    if (stepNumber === 3) {
        const quarto = document.getElementById('quarto').value;
        const checkinVal = document.getElementById('checkin').value;
        const checkoutVal = document.getElementById('checkout').value;

        if (!quarto || !checkinVal || !checkoutVal) {
            alert('Preencha todos os dados da estadia (Quarto, Check-in e Check-out).');
            return;
        }

        const checkin = new Date(checkinVal);
        const checkout = new Date(checkoutVal);
        if (checkout <= checkin) {
            alert('A data de saída deve ser posterior à data de entrada.');
            return;
        }
    }

    // Altera a classe active para mostrar a aba correta
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step').forEach(indicator => indicator.classList.remove('active'));
    
    document.getElementById(`step${stepNumber}`).classList.add('active');
    document.getElementById(`stepIndicator${stepNumber}`).classList.add('active');
}

function prevStep(stepNumber) {
    document.querySelectorAll('.form-step').forEach(step => step.classList.remove('active'));
    document.querySelectorAll('.step').forEach(indicator => indicator.classList.remove('active'));
    
    document.getElementById(`step${stepNumber}`).classList.add('active');
    document.getElementById(`stepIndicator${stepNumber}`).classList.add('active');
}

// --- 3. MÁSCARA AUTOMÁTICA DE CPF ---
document.getElementById('cpf').addEventListener('input', function (e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo o que não é número
    if (value.length > 11) value = value.slice(0, 11);
    
    // Aplica a formatação de pontos e traço
    value = value.replace(/^(\d{3})(\d)/, '$1.$2')
                 .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
                 .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    e.target.value = value;
});

// --- 4. CONTROLE DINÂMICO DE DATAS ---
const hoje = new Date().toISOString().split('T')[0];
document.getElementById('checkin').min = hoje; // Impede escolher data passada para o check-in

document.getElementById('checkin').addEventListener('change', function() {
    document.getElementById('checkout').min = this.value; // Checkout não pode vir antes do check-in selecionado
});

// --- 5. PROCESSAMENTO DO PAGAMENTO E EXIBIÇÃO DO MODAL ---
document.getElementById('multiStepForm').addEventListener('submit', function(e) {
    e.preventDefault(); // Impede o recarregamento da página

    // Captura os dados preenchidos
    const nome = document.getElementById('nome').value;
    const cpf = document.getElementById('cpf').value;
    const quartoSelect = document.getElementById('quarto');
    const quartoNome = quartoSelect.options[quartoSelect.selectedIndex].text;
    const precoDiaria = parseFloat(quartoSelect.options[quartoSelect.selectedIndex].getAttribute('data-price'));
    const checkin = new Date(document.getElementById('checkin').value);
    const checkout = new Date(document.getElementById('checkout').value);
    const formaPagamento = document.getElementById('pagamento').value;

    // Calcula as diárias exatas
    const diferencaTempo = Math.abs(checkout - checkin);
    const totalDias = Math.ceil(diferencaTempo / (1000 * 60 * 60 * 24));
    let valorTotal = totalDias * precoDiaria;

    // Configura o texto de introdução do modal
    document.getElementById('modalWelcome').innerHTML = `
        Olá <strong>${nome}</strong> (CPF: ${cpf}), sua estadia na <strong>${quartoNome}</strong> para <strong>${totalDias} diária(s)</strong> foi gerada!
    `;
    
    const paymentArea = document.getElementById('paymentArea');
    paymentArea.innerHTML = ''; // Reseta o HTML interno da área de pagamento

    // Renderiza a interface correta de acordo com a opção de pagamento selecionada
    if (formaPagamento === 'pix') {
        valorTotal *= 0.95; // Aplica 5% de desconto no Pix
        paymentArea.innerHTML = `
            <p style="font-weight:bold; color: #1f2937;">Total com Desconto Pix (-5%): R$ ${valorTotal.toFixed(2).replace('.', ',')}</p>
            <div class="qr-code">QR CODE PIX SIMULADO</div>
            <p style="font-size:0.85rem; color:var(--gray)">Abra o app do seu banco e escaneie o código acima para concluir.</p>
        `;
    } else if (formaPagamento === 'boleto') {
        paymentArea.innerHTML = `
            <p style="font-weight:bold; color: #1f2937;">Valor Total: R$ ${valorTotal.toFixed(2).replace('.', ',')}</p>
            <div class="barcode"></div>
            <p style="font-size:0.85rem; color:var(--gray); word-break: break-all;">Linha digitável:<br><strong>34191.79001 01043.513184 91020.150008 7 90000000</strong></p>
        `;
    } else { // Caso escolha Cartão de Crédito ou Débito
        const tipoCartao = formaPagamento === 'cartao_credito' ? 'Crédito' : 'Débito';
        paymentArea.innerHTML = `
            <p style="font-weight:bold; margin-bottom: 1rem; color: #1f2937;">Total a ser debitado: R$ ${valorTotal.toFixed(2).replace('.', ',')}</p>
            <div style="text-align:left; font-size:0.9rem;">
                <label style="display:block; margin-bottom:0.2rem; font-weight:600; color:var(--dark)">Número do Cartão de ${tipoCartao}</label>
                <input type="text" placeholder="**** **** **** ****" style="width:100%; padding:0.5rem; margin-bottom:0.8rem; border:1px solid #ccc; border-radius:4px;" required>
                <div style="display:flex; gap:0.5rem;">
                    <div style="flex:1;">
                        <label style="display:block; margin-bottom:0.2rem; font-weight:600; color:var(--dark)">Validade</label>
                        <input type="text" placeholder="MM/AA" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;" required>
                    </div>
                    <div style="flex:1;">
                        <label style="display:block; margin-bottom:0.2rem; font-weight:600; color:var(--dark)">CVV</label>
                        <input type="text" placeholder="123" style="width:100%; padding:0.5rem; border:1px solid #ccc; border-radius:4px;" required>
                    </div>
                </div>
            </div>
        `;
    }

    // Abre o Modal na tela
    document.getElementById('paymentModal').style.display = 'flex';
});

function closeModal() {
    document.getElementById('paymentModal').style.display = 'none';
    document.getElementById('multiStepForm').reset(); // Limpa todos os campos
    prevStep(1); // Retorna o formulário para o Passo 1
}
