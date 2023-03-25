let myChart;
let fieldsArray;

// Fetch data from API
function fetchData(inputRows, selectedModel) {
    fetch(
        `https://opendata-reunion.edf.fr/api/records/1.0/search/?dataset=prod-electricite-temps-reel&q=&rows=${inputRows}&sort=date`
    )
    .then((response) => {
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then((data) => {
        const records = data.records;
        fieldsArray = records.map(record => record.fields);

        function updateValues(data) {
            const fields = [
                "total",
                "bioenergies",
                "hydraulique",
                "diesel",
                "charbon",
                "photovoltaique",
                "eolien",
                "turbines_a_combustion",
            ];

            fields.forEach((field) => {
                const fieldValue = data.records[0].fields[field];
                const roundedFieldValue = fieldValue.toFixed(2);
                const fieldElement = document.getElementById(`${field}Value`);
                fieldElement.innerHTML = roundedFieldValue;
            });
        }

        // Utilisation de la fonction updateValues avec les données reçues
        updateValues(data);

        function creer_select_modele(fieldsArray) {
            const select_modele = document.getElementById("select-modele");

            // Ajoutez une option "Tous" au début du menu déroulant
            select_modele.innerHTML += `
                <option value="all">Tous</option>
            `;

            const options = [
                "bioenergies",
                "hydraulique",
                "diesel",
                "charbon",
                "photovoltaique",
                "eolien",
                "turbines_a_combustion",
            ];

            options.forEach((option) => {
                select_modele.innerHTML += `
                    <option value="${option}">${option}</option>
                `;
            });
        }


        document.getElementById("select-modele").addEventListener("change", function(event) {
            const selectedOption = event.target.value;
            updateGraph(selectedOption);
        });

        document.getElementById("select-modele").addEventListener("change", function(event) {
            const selectedOption = event.target.value;
            updateGraph(selectedOption, inputRows);
        });

        const defaultOption = selectedModel || "all";
        const defaultData = getSelectedOptionData(defaultOption);
        initChart(defaultData);
    })
    .catch((error) => {
        console.error("Erreur lors de la récupération des données:", error);
        // Gérer l'affichage de l'erreur dans l'interface utilisateur
        const errorMessage = document.createElement("div");
        errorMessage.textContent = "Erreur lors de la récupération des données. Veuillez réessayer ultérieurement.";
        errorMessage.style.color = "red";
        const h1Element = document.querySelector("h1");
        h1Element.insertAdjacentElement("afterend", errorMessage);
    });        
}  

// Initialize chart with data
function initChart(data) {
    const ctx = document.getElementById("myChart").getContext("2d");

    const timeFormat = "DD MMMM YYYY";
    let previousDate = null;

    if (myChart) {
        myChart.destroy(); // Détruit le graphique existant s'il existe
    }

    myChart = new Chart(ctx, {
        type: "line",
        data: data,
        options: {
            scales: {
                x: {
                    type: "time",
                    time: {
                        unit: "hour",
                        displayFormats: {
                            hour: "HH:mm",
                        },
                        tooltipFormat: "HH:mm",
                    },
                    ticks: {
                        callback: function (value, index, values) {
                        const date = new Date(value);
                        const formattedDate = moment(date).format(timeFormat);
                        const formattedTime = moment(date).format("HH:mm");

                        if (previousDate === null || previousDate !== formattedDate) {
                            previousDate = formattedDate;
                            return `${formattedDate}`;
                        } else {
                            return formattedTime;
                        }
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Update graph with selected option and number of rows
function updateGraph(selectedOption, numberOfRows) {
    const data = getSelectedOptionData(selectedOption, numberOfRows);
    updateGraphWithData(data);
}

// Get selected option data for number of rows selected
function getSelectedOptionData(selectedOption, numberOfRows) {
    const data = {
        labels: [],
        datasets: [],
    };

    fieldsArray.forEach((fields) => {
        const date = new Date(fields.date);
        data.labels.push(date);
    });

    const limitedFieldsArray = fieldsArray.slice(0, numberOfRows);

    limitedFieldsArray.forEach((fields) => {
        const date = new Date(fields.date);
        data.labels.push(date);
    });

    const options = [
        { key: "bioenergies", color: "rgba(75, 192, 192, 1)" },
        { key: "hydraulique", color: "rgba(255, 99, 132, 1)" },
        { key: "diesel", color: "rgba(255, 206, 86, 1)" },
        { key: "charbon", color: "rgba(153, 102, 255, 1)" },
        { key: "photovoltaique", color: "rgba(54, 162, 235, 1)" },
        { key: "eolien", color: "rgba(201, 203, 207, 1)" },
        { key: "turbines_a_combustion", color: "rgba(100, 120, 80, 1)" },
    ];

    if (selectedOption === "all") {
        options.forEach((option) => {
            const dataset = {
                label: getDisplayName(option.key),
                data: fieldsArray.map((fields) => fields[option.key]),
                backgroundColor: option.color,
                borderColor: option.color,
                borderWidth: 1,
            };
            data.datasets.push(dataset);
        });
    } else {
        const selectedOptionColor = options.find((option) => option.key === selectedOption).color;

        const dataset = {
            label: getDisplayName(selectedOption),
            data: fieldsArray.map((fields) => fields[selectedOption]),
            backgroundColor: selectedOptionColor,
            borderColor: selectedOptionColor,
            borderWidth: 1,
        };
                data.datasets.push(dataset);
            }

    return data;
}

// Update chart data with new data
function updateGraphWithData(data) {
    myChart.data.labels = data.labels;
    myChart.data.datasets = data.datasets;
    myChart.update();
}

// Return display name for chart legend
function getDisplayName(option) {
    switch (option) {
        case "bioenergies":
        return "Bioénergies";
        case "hydraulique":
        return "Hydraulique";
        case "diesel":
        return "Diesel";
        case "charbon":
        return "Charbon";
        case "photovoltaique":
        return "Photovoltaïque";
        case "eolien":
        return "Éolien";
        case "turbines_a_combustion":
        return "Turbines à combustion";
        default:
        return option;
    }
}

let countdownElement = document.getElementById("countdown");
let remainingTime = 300; // 5 minutes en secondes

// Update countdown timer element
function updateCountdown() {
    remainingTime--;
    countdownElement.textContent = remainingTime;

    if (remainingTime <= 0) {
        location.reload();
    } else {
        setTimeout(updateCountdown, 1000); // Met à jour le compte à rebours toutes les secondes
    }
}

setTimeout(updateCountdown, 1000);

// Set default number of rows to fetch
const defaultRows = 10; 
fetchData(defaultRows);

// Fetch data with new number of rows and selected model
document.getElementById("submit-rows").addEventListener("click", function () {
const inputRows = document.getElementById("input-rows").value;
const selectedModel = document.getElementById("select-modele").value;
fetchData(inputRows, selectedModel);
});