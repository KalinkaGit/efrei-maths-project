const parser = new Parser();

async function loadData(filePath) {
    try {
        const response = await fetch(filePath);
        const data = await response.text();

        parser.parse(data);

    } catch (error) {
        console.error('Erreur de chargement du fichier:', error);
    }
}