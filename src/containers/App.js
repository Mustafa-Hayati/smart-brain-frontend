import React, { Component } from "react";
import "./App.css";
import Navigation from "../components/Navigation/Navigation";
import Logo from "../components/Logo/Logo";
import ImageLinkForm from "../components/ImageLinkForm/ImageLinkForm";
import Rank from "../components/Rank/Rank";
import Particles from "react-particles-js";
import API_KEY from "../CLARIFAI_API_KEY";
import Clarifai from "clarifai";
import FaceRecognition from "../components/FaceRecognition/FaceRecognition";
import Signin from "../components/Signin/Signin";
import Register from "../components/Register/Register";

const app = new Clarifai.App({
  apiKey: API_KEY
});

const particlesOptions = {
  particles: {
    number: {
      value: 150,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
};

const initialState = {
  input: "",
  imageUrl: "",
  boxes: [],
  route: "signin",
  isSignedIn: false,
  user: {
    id: "",
    name: "",
    email: "",
    entries: 0,
    joined: ""
  }
};

class App extends Component {
  state = {
    input: "",
    imageUrl: "",
    boxes: [],
    route: "signin",
    isSignedIn: false,
    user: {
      id: "",
      name: "",
      email: "",
      entries: 0,
      joined: ""
    }
  };

  loadUser = data => {
    this.setState({
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        entries: data.entries,
        joined: data.joined
      }
    });
  };

  calculateFaceLocation = data => {
    const allRegions = data.outputs[0].data.regions;
    const faces = allRegions.map(
      region => region.region_info.bounding_box
    );
    const image = document.getElementById("inputImage");
    const width = Number(image.width);
    const height = Number(image.height);
    const boxes = faces.map(face => {
      return {
        leftCol: face.left_col * width,
        topRow: face.top_row * height,
        rightCol: width - face.right_col * width,
        bottomRow: height - face.bottom_row * height
      };
    });
    return boxes;
  };

  displayFaceBox = boxes => {
    this.setState({ boxes });
  };

  onInputChange = e => {
    this.setState({
      input: e.target.value
    });
  };

  onPictureSubmit = e => {
    this.setState({ imageUrl: this.state.input });
    app.models
      .predict(Clarifai.FACE_DETECT_MODEL, this.state.input)
      .then(response => {
        if (response) {
          fetch("http://127.0.0.1:8080/image", {
            method: "put",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              id: this.state.user.id
            })
          })
            .then(response => response.json())
            .then(count => {
              this.setState(
                Object.assign(this.state.user, { entries: count })
              );
            })
            .catch(console.log);
        }
        this.displayFaceBox(this.calculateFaceLocation(response));
      })
      .catch(err => {
        console.log(err);
      });
  };

  onRouteChange = route => {
    if (route === "signout") {
      this.setState(initialState);
    } else if (route === "home") {
      this.setState({ isSignedIn: true });
    }
    this.setState({ route });
  };

  render() {
    const { isSignedIn, route, boxes, imageUrl } = this.state;
    return (
      <div className="App">
        <Particles params={particlesOptions} className="particles" />
        <Navigation
          isSignedIn={isSignedIn}
          onRouteChange={this.onRouteChange}
        />
        {route === "signin" ||
        route === "register" ||
        route === "signout" ? (
          route === "register" ? (
            <Register
              onRouteChange={this.onRouteChange}
              loadUser={this.loadUser}
            />
          ) : (
            <Signin
              loadUser={this.loadUser}
              onRouteChange={this.onRouteChange}
            />
          )
        ) : (
          <div>
            <Logo />
            <Rank
              name={this.state.user.name}
              entries={this.state.user.entries}
            />
            <ImageLinkForm
              onInputChange={this.onInputChange}
              onPictureSubmit={this.onPictureSubmit}
            />
            <FaceRecognition boxes={boxes} imageUrl={imageUrl} />
          </div>
        )}
      </div>
    );
  }
}

export default App;
