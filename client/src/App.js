import "./App.css";
import { useState } from "react";

function App() {
  const [clientData, setClientData] = useState();
  const [clientShow, setClientShow] = useState({
    bus: false,
    stop: false,
    route: false,
  });
  const [data, setData] = useState();

  function toggleShowBus() {
    if (clientShow.bus) {
      setClientShow({ ...clientShow, bus: false });
    } else {
      setClientShow({ ...clientShow, bus: true });
    }
    return;
  }

  function toggleShowStop() {
    if (clientShow.stop) {
      setClientShow({ ...clientShow, stop: false });
    } else {
      setClientShow({ ...clientShow, stop: true });
    }
    return;
  }

  function toggleShowRoute() {
    if (clientShow.route) {
      setClientShow({ ...clientShow, route: false });
    } else {
      setClientShow({ ...clientShow, route: true });
    }
    return;
  }

  async function clientGet() {
    const res = await fetch("api/data", {
      method: "GET",
    });
    if (res.ok) {
      let result = await res.json();
      setClientData(result);
    } else {
      console.log(`Error, ${res.status}`);
    }
  }

  async function adminGet() {
    const res = await fetch("api/admin", {
      method: "GET",
    });
    if (res.ok) {
      let result = await res.json();
      setData(result);
    } else {
      console.log(`Error, ${res.status}`);
    }
  }

  async function adminUpdate() {
    const res = await fetch("api/admin", {
      method: "POST",
    });
    if (res.ok) {
      let result = await res.json();
      alert("Bus data updated");
      setData(result);
    } else {
      console.log(`Error, ${res.status}`);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ border: "1px solid black" }}>
          <button onClick={clientGet}>Client Get</button>
          {clientData ? (
            <>
              <h1>
                Last Updated: {new Date(clientData.date).toLocaleDateString()},{" "}
                {new Date(clientData.date).toLocaleTimeString()}
              </h1>
              <h3 className="clickable" onClick={toggleShowBus}>
                Buses: {clientData.bus.length}
              </h3>
              {clientShow.bus ? <p>{JSON.stringify(clientData.bus[0])}</p> : ""}
              <h3 className="clickable" onClick={toggleShowStop}>
                Stops: {Object.keys(clientData.stop).length}
              </h3>
              {clientShow.stop ? (
                <p>
                  {JSON.stringify(
                    clientData.stop[Object.keys(clientData.stop)[0]]
                  )}
                </p>
              ) : (
                ""
              )}
              <h3 className="clickable" onClick={toggleShowRoute}>
                Routes: {Object.keys(clientData.route).length}
              </h3>
              {clientShow.route ? (
                <p>
                  {JSON.stringify(
                    clientData.route[Object.keys(clientData.route)[0]]
                  )}
                </p>
              ) : (
                ""
              )}
            </>
          ) : (
            ""
          )}
        </div>
        <div style={{ border: "1px solid black" }}>
          <button onClick={adminGet}>Admin Get</button>
          {data
            ? data.map((x) => {
                let date = new Date(x.date);
                return (
                  <>
                    <h1>
                      Order {x.order} ({date.toLocaleDateString()},{" "}
                      {date.toLocaleTimeString()})
                    </h1>
                    <h3>Buses: {x.bus.length}</h3>
                    <h3>Stops: {Object.keys(x.stop).length}</h3>
                    <h3>Routes: {Object.keys(x.route).length}</h3>
                  </>
                );
              })
            : ""}
          <button onClick={adminUpdate}>Admin Update</button>
        </div>
      </header>
    </div>
  );
}

export default App;
