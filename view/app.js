let map = L.map('map', {

}).setView([51.505, -0.09], 13);
let saveButton = document.getElementById('saveButton')
let downloadButton = document.getElementById('downloadButton')
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

let centerIconUrl = 'marker.png';

let cordinate_list = []

let centerIcon = L.icon({
    iconUrl: centerIconUrl,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
});

let centerMarker = L.marker(map.getCenter(), {
    icon: centerIcon,
}).addTo(map);

map.on('move', function () {
    centerMarker.setLatLng(map.getCenter());
});

let markers = [];
let idCounter = 0;

document.addEventListener('DOMContentLoaded', function () {

    updateSidebarFromServer();
});

map.addEventListener('mousedown', () => {
    saveButton.setAttribute('disabled', 'true')
    map.dragging.enable();

})

map.addEventListener('mouseup', () => {
    saveButton.removeAttribute('disabled')
    map.dragging.disable();
    setTimeout(() => {
        map.dragging.enable();
    }, 50);


})

map.addEventListener('mouseout', () => {
    saveButton.removeAttribute('disabled')
    map.dragging.disable();
    setTimeout(() => {
        map.dragging.enable();
    }, 50);
})

saveButton.addEventListener('click', function () {
    saveButton.setAttribute('disabled', 'true')
    let center = map.getCenter();
    addMarker(center);
    saveButton.removeAttribute('disabled')
});

async function addMarker(latlng) {


    //marker control
    let control = 0

    if(cordinate_list.filter(function(a){
        return a.lat == latlng.lat && a.lng == latlng.lng
    }).length > 0){
        control = 1
    }


    if(control == 1){
        console.log('marker couldnt be added')
        return false
    }
    
    let marker = L.marker(latlng).addTo(map);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
        "lat": latlng.lat,
        "lng": latlng.lng,
        "date": new Date()
    });

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw
    };

    await fetch("http://localhost:3000/add", requestOptions)
        .then((response) => response.json())
        .then((result) => {
            if(result[0].R == 'S'){
                updateSidebarFromServer()
            }
        })
        .catch((error) => console.error(error));
}

function updateSidebar(data) {
    cordinate_list = data
    let sidebar = document.getElementById('sidebar');
    sidebar.innerHTML = '';

    if (data.length == 0) {
        sidebar.innerHTML = `
            <div class="card mb-2">
                <div class="card-body text-center">
                    <p class="card-text">Veri bulunamadı.</p>
                </div>
            </div>
        `;
    } else {
        data.forEach(marker => {

            let card = document.createElement('div');
            card.classList.add('card', 'mb-2');

            card.innerHTML = `
                    <div class="card-body" style="cursor:pointer;">
                        <p class="card-text">Lat: ${marker.lat.toFixed(2)}, Lng: ${marker.lng.toFixed(2)}</p>
                        <button class="deleteButton btn btn-danger btn-sm float-end">Sil</button>
                    </div>
                `;

            let deleteButton = card.querySelector('button');
            deleteButton.addEventListener('click', function () {
                deleteMarker(marker.id,marker.lat,marker.lng);
            });

            card.addEventListener('click', (event) => {
                if (event.target.classList[0] != 'deleteButton') {
                    map.setView(L.latLng(marker.lat, marker.lng), 13)
                    L.marker(marker).addTo(map);
                }

            })

            sidebar.appendChild(card);
        });
    }

}

async function updateSidebarFromServer() {
    try {
        const response = await fetch("http://localhost:3000/list");
        const data = await response.json();
        updateSidebar(data)
    } catch (error) {
        console.error("Hata:", error);
    }
}

async function deleteMarker(id,lat,lng) {
    try {
        const response = await fetch(`http://localhost:3000/remove?id=${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            const result = await response.json();
            if(result[0].R == 'S'){
                map.eachLayer(function(layer) {
                    if (layer instanceof L.Marker) {
                        const marker = layer;
                        if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lng) {
                            map.removeLayer(marker);
                        }
                    }
                });
                updateSidebarFromServer()
            }
        } else {
            console.error('Failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function downloadJson() {
    fetch('data.json')
        .then(response => response.json())
        .then(jsonData => {
            var jsonString = JSON.stringify(jsonData);

            var blob = new Blob([jsonString],{type: 'application/json'});

            var url = URL.createObjectURL(blob);

            var a = document.createElement('a');
            a.href = url;
            a.download = 'coordinates.json';

            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url); //prevents unnecessary memory usage
        })
        .catch(error => console.error('Veri indirme hatası:', error));
}