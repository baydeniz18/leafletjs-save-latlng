
// first needs

    let map = L.map('map',{
        // dragging:false // It prevents you to drag the map but we need to drag , to prevent move after drag I found another solution

    }).setView([51.505, -0.09], 13);
    let saveButton = document.getElementById('saveButton')
    let downloadButton = document.getElementById('downloadButton')
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    let markers = [];
    let idCounter = 0;

//---------------------

//onlaod

    document.addEventListener('DOMContentLoaded', function() {

        updateSidebarFromServer();
    });

//---------------------

// While mouse is moving , I disabled the button

    //also I prevented it from continuing to scroll after I swiped and released it

    // If you want to remove it you can remove map.dragging.disable() and map.dragging.enable() functions

    map.addEventListener('mousedown',()=>{
        saveButton.setAttribute('disabled','true')
        map.dragging.enable();

    })

    map.addEventListener('mouseup',()=>{
        saveButton.removeAttribute('disabled')
        map.dragging.disable();
        setTimeout(() => {
            map.dragging.enable(); 
        }, 50);


    })

    map.addEventListener('mouseout',()=>{
        saveButton.removeAttribute('disabled')
        map.dragging.disable();
        setTimeout(() => {
            map.dragging.enable(); 
        }, 50);
    })

//----------------------------------------------

// here we take the center of the map as lat and lang , and we do add point.

    saveButton.addEventListener('click', function() {
        saveButton.setAttribute('disabled','true')
        let center = map.getCenter();
        addMarker(center);
        saveButton.removeAttribute('disabled')
        showNotification('Kordinatlar sisteme kaydedildi','success')
    });

    async function addMarker(latlng) {
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
          .then((result) => console.log(result))
          .catch((error) => console.error(error));
    }

    function updateSidebar(data) {
        let sidebar = document.getElementById('sidebar');
        sidebar.innerHTML = '';

        if(data.length == 0){
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
                        <button class="btn btn-danger btn-sm float-end">Sil</button>
                    </div>
                `;
        
                let deleteButton = card.querySelector('button');
                deleteButton.addEventListener('click', function() {
                    deleteMarker(marker.id);
                });
        
                sidebar.appendChild(card);
            });
        }

    }

//------------------------------------------------------------------

//list 

    async function updateSidebarFromServer() {
        try {
            const response = await fetch("http://localhost:3000/list");
            const data = await response.json();
            updateSidebar(data)
        } catch (error) {
            console.error("Hata:", error);
        }
    }

//---------------------

//delete

    async function deleteMarker(id) {
        try {
            const response = await fetch(`http://localhost:3000/remove?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                const result = await response.json();
                console.log(result);
                updateSidebarFromServer();
            } else {
                console.error('Failed');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

//---------------------

    function downloadJSON(data) {
        let json = JSON.stringify(data);
        let blob = new Blob([json], {type: 'application/json'});
        let url = URL.createObjectURL(blob);
        let a = document.createElement('a');
        a.href = url;
        a.download = 'data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function showNotification(message, type) {
        toastr.options = {
            closeButton: true,
            positionClass: 'toast-top-right',
            timeOut: 2000
        };

        if (type === 'success') {
            toastr.success(message);
        } else if (type === 'error') {
            toastr.error(message);
        }
    }