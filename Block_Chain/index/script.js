const SHA256 = CryptoJS.SHA256;
const AES = CryptoJS.AES.encrypt;

class Cell {
    constructor(marca, modelo, imei, proveedor, vendido = false, comprador = '', cedula = '', robado = false) {
        this.marca = marca;
        this.modelo = modelo;
        this.imei = imei;
        this.proveedor = proveedor;
        this.vendido = vendido;
        this.comprador = comprador;
        this.cedula = cedula;
        this.robado = robado;
        this.timestamp = new Date();
    }
}

class Block {
    constructor(index, data, previousHash = '') {
        this.index = index;
        this.date = new Date();
        this.data = data;
        this.previousHash = previousHash;
        this.hash = this.createHash();
    }

    createHash() {
        return SHA256(this.index + this.date + JSON.stringify(this.data) + this.previousHash).toString();
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.imeiChains = {};
    }

    createGenesisBlock() {
        return new Block(0, 'Genesis Block');
    }

    getLastBlock(imei) {
        const chain = this.imeiChains[imei] || this.chain;
        return chain[chain.length - 1];
    }

    addBlock(data) {
        const imei = data.imei;
        const prevBlock = this.getLastBlock(imei);
        const block = new Block(prevBlock.index + 1, data, prevBlock.hash);

        if (this.imeiChains[imei]) {
            this.imeiChains[imei].push(block);
        } else {
            this.imeiChains[imei] = [block];
        }
    }

    buscarPorIMEI(imei) {
        const chain = this.imeiChains[imei] || [];
        return chain;
    }
}

const blockchain = new Blockchain();

function registerCell() {
    const marcaCell = document.getElementById('marcaCell').value;
    const modeloCell = document.getElementById('modeloCell').value;
    const imeiCell = document.getElementById('imeiCell').value;
    const proveedorCell = document.getElementById('proveedorCell').value;

    const cellData = new Cell(marcaCell, modeloCell, imeiCell, proveedorCell);
    blockchain.addBlock(cellData);
    updateListaCell();

    // Limpiar los campos de entrada después de registrar
    document.getElementById('marcaCell').value = '';
    document.getElementById('modeloCell').value = '';
    document.getElementById('imeiCell').value = '';
    document.getElementById('proveedorCell').value = '';
}

function updateListaCell() {
    const ListaCell = document.getElementById('ListaCell');
    ListaCell.innerHTML = '';

    for (const imei in blockchain.imeiChains) {
        const chain = blockchain.imeiChains[imei];
        const listItem = document.createElement('li');
        listItem.innerHTML = `<h3>IMEI: ${imei}</h3><ul>`;

        chain.forEach((block, index) => {
            const subListItem = document.createElement('li');
            const timestamp = new Date(block.data.timestamp).toLocaleString();
            const estado = block.data.vendido ? `Vendido a ${block.data.comprador}` : 'No vendido';
            const robado = block.data.robado ? 'Dispositivo robado' : '';
            subListItem.innerHTML = `Marca: ${block.data.marca} Modelo: ${block.data.modelo} Proveedor: ${block.data.proveedor} Estado: ${estado} ${robado} Fecha: ${timestamp}`;

            const editButton = document.createElement('button');
            editButton.textContent = 'Editar';
            editButton.onclick = function() {
                editarCelular(imei, index);
            };

            subListItem.appendChild(editButton);
            listItem.querySelector('ul').appendChild(subListItem);
        });

        ListaCell.appendChild(listItem);
    }
}

function editarCelular(imei, index) {
    const chain = blockchain.imeiChains[imei];
    const block = chain[index];
    const marcaEdit = document.getElementById('marcaEdit');
    const modeloEdit = document.getElementById('modeloEdit');
    const imeiEdit = document.getElementById('imeiEdit');
    const comprador = document.getElementById('comprador');
    const cedula = document.getElementById('cedula');
    const robadoPerdido = document.getElementById('robadoPerdido');

    marcaEdit.value = block.data.marca;
    modeloEdit.value = block.data.modelo;
    imeiEdit.value = block.data.imei;
    comprador.value = block.data.comprador;
    cedula.value = block.data.cedula;
    robadoPerdido.checked = block.data.robado;

    // Guardar el IMEI y el índice del bloque a editar
    document.getElementById('indexEdit').value = index;
    document.getElementById('imeiEdit').value = imei;

    // Mostrar el formulario de edición
    document.getElementById('editarCelular').style.display = 'block';
}

function actualizarCelular() {
    const imei = document.getElementById('imeiEdit').value;
    const index = parseInt(document.getElementById('indexEdit').value);
    const marca = document.getElementById('marcaEdit').value;
    const modelo = document.getElementById('modeloEdit').value;
    const comprador = document.getElementById('comprador').value;
    const cedula = document.getElementById('cedula').value;
    const robadoPerdido = document.getElementById('robadoPerdido').checked;

    if (blockchain.imeiChains[imei] && index >= 0 && index < blockchain.imeiChains[imei].length) {
        const chain = blockchain.imeiChains[imei];
        const blockAnterior = chain[index];
        const estadoAnterior = blockAnterior.data;

        // Crear un nuevo objeto Cell con los datos actualizados
        const cellData = new Cell(marca, modelo, imei, estadoAnterior.proveedor, comprador !== '', comprador, cedula, robadoPerdido);

        // Actualizar datos del celular en la cadena de bloques
        blockchain.addBlock(cellData);

        // Ocultar el formulario de edición
        document.getElementById('editarCelular').style.display = 'none';

        // Actualizar la lista después de la edición
        updateListaCell();
    } else {
        alert('Índice de bloque o IMEI no válido.');
    }
}

function cancelarEdicion() {
    // Ocultar el formulario de edición
    document.getElementById('editarCelular').style.display = 'none';

    // Limpiar los campos del formulario de edición
    document.getElementById('marcaEdit').value = '';
    document.getElementById('modeloEdit').value = '';
    document.getElementById('imeiEdit').value = '';
    document.getElementById('comprador').value = '';
    document.getElementById('cedula').value = '';
    document.getElementById('robadoPerdido').checked = false;
}

function buscarPorIMEI() {
    const imei = document.getElementById('imeiSearch').value;
    const chain = blockchain.buscarPorIMEI(imei);

    const resultadoBusqueda = document.getElementById('resultadoBusqueda');
    resultadoBusqueda.innerHTML = '';

    if (chain.length === 0) {
        resultadoBusqueda.innerHTML = '<p>No se encontraron registros para el IMEI ingresado.</p>';
    } else {
        chain.forEach((block, index) => {
            const blockItem = document.createElement('div');
            const timestamp = new Date(block.data.timestamp).toLocaleString();
            const estado = block.data.vendido ? `Vendido a ${block.data.comprador}` : 'No vendido';
            const robado = block.data.robado ? 'Dispositivo robado' : '';
            const cedula = block.data.cedula ? CryptoJS.AES.encrypt(block.data.cedula, 'clave_secreta').toString() : '';
            blockItem.innerHTML = `Marca: ${block.data.marca} Modelo: ${block.data.modelo} IMEI: ${block.data.imei} Proveedor: ${block.data.proveedor} Estado: ${estado} ${robado} Cédula: ${cedula} Fecha: ${timestamp}`;
            resultadoBusqueda.appendChild(blockItem);
        });
    }
}