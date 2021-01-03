// canvas size
w = 500;
h = 500;

// appearance
draw_points = false;
draw_speckles = false;
draw_lines = true;
refresh_connectivity = true;
num_connections = 6;
point_weight = 5;
line_weight = 1.5;
speckles_weight = 2;
line_color = [255, 255, 255];
max_alpha = 128;
bckg_color = [0];
speckles_color = 255;
fade = true;

// noise properties
noise_speed = 0.1;
freq = 0.001;

// points properties
num_vertices = 50;
points = [];
ping_pong = [];
move_speed = 0.5;
velocity = [];
connected = [];

// extra specles
num_speckles = 300;
speckles  = [];

function setup() {
  createCanvas(500, 500);

  // Randomly scatter points
  scatterPoints();
  scatterSpeckles();
}

function draw() {
  background(bckg_color);
  
  // t += 1;
  
  movePoints();
  
  if (draw_points) {
    strokeWeight(point_weight);
    for (i = 0; i < num_vertices; i++) {
        point(points[i].x, points[i].y);
    }
  }
  
  stroke(speckles_color);
  if (draw_speckles) {
    strokeWeight(speckles_weight);
    for (i = 0; i < num_speckles; i++) {
        point(speckles[i].x, speckles[i].y);
    }
  }
  
  stroke(line_color);
  if (draw_lines) {
    strokeWeight(line_weight);
    for (i = 0; i < num_vertices; i++) {
      closestK = connected[i];
      if (refresh_connectivity) {
        if (num_connections == 1) {
          closestK = closest(i);
        }
        else {
          // if we fade between legs, we retreive one more 
          // point to fade with
          let k_eff = num_connections;
          if (fade) {
            k_eff ++;
          }

          [closestK, closestKdist] = closestKpoints(i, k_eff);
        }
      }

      let furthest2;
      let furthest1;
      let alpha = [];
      if (fade) {
        furthest1 = argmax(closestKdist);

        // alpha of the longest leg will be interpolated between 0 and the max alpha,
        // the interpolent being the distance ratio to the top K+1 point over the longest leg,
        // clamped to 2 times the distance.
        for (let  i = 0; i < closestK.length; i++) {
          append(alpha, min([closestKdist[furthest1] / closestKdist[i] - 1, 1]) * max_alpha);
        }
      }

      for (let j = 0; j < closestK.length; j++) {
        if (j != furthest1) { 
          if (fade) {
            stroke(line_color[0], line_color[1], line_color[2], alpha[j]);
          }
          else {
            stroke(line_color[0], line_color[1], line_color[2], max_alpha);
          }
          line(closestK[j].x, closestK[j].y, points[i].x, points[i].y);
        }
      }
    }
  }
}

// Scatter points randomly on the canvas
function scatterPoints() {
  for (i1 = 0; i1 < num_vertices; i1++) {
    points.push(createVector(random(width), random(height)));
    theta = random(1) * 2 * PI;
    velocity.push(createVector(move_speed * Math.cos(theta), move_speed * Math.sin(theta)));
    ping_pong.push(createVector(1, 1));
  }
  
  for (i1 = 0; i1 < num_vertices; i1++) {
    if (num_connections == 1) {
      connected.push(closest(i1));
    }
    else {
      connected.push(closestKpoints(i1, num_connections));
    }
  }
}

// Scatter points randomly on the canvas
function scatterSpeckles() {
  for (i1 = 0; i1 < num_speckles; i1++) {
    speckles.push(createVector(random(width), random(height)));
  }
}


function closest(point_idx) {
  min_idx = 0;
  min_d = w * h;
  for (i2 = 0; i2 < speckles.length; i2++) {
    if (i2 != point_idx) {
      d = points[point_idx].dist(speckles[i2]);
      if (d < min_d) {
        min_idx = i2;
        min_d = d;
      }
    }
  }
  
  return [speckles[min_idx]];
}

// Find top 3 closest points in neighbouring cells
function closestKpoints(vtx_idx, k = 3) {
  let buffer_dist = []
  // Compute all distances
  for (let i3 = 0; i3 < speckles.length; i3++) {
    buffer_dist.push(points[vtx_idx].dist(speckles[i3]));
  }
  
  // retrieve bottomK of buffer_dist
  let tmp_idx = bottomK(buffer_dist, k);
  
  // store the k closest points
  let closestKpointsClosest = []
  let closestKdist = []
  for (let i3 = 0; i3 < k; i3++)
  {
    closestKpointsClosest.push(speckles[tmp_idx[i3]]);
    closestKdist.push(buffer_dist[tmp_idx[i3]]);
  }
  
  return [closestKpointsClosest, closestKdist];
}

// returns the indices of the bottom k items
function bottomK(array, k) {
  // find k closest neighbours
  // Make a tmp buffer containing the first k elements of the array
  let tmp = array.slice(0, k);
  let tmp_idx = [];
  for (let i = 0; i < k; i++) {
    append(tmp_idx, i);
  }

  // find largest element of the array
  let M = argmax(tmp);

  // for all remaining elements, if one is closest than the max,
  // store it in place of the max, and recompute the max
  for (let i3 = k; i3 < array.length; i3++) {
    if (array[i3] < tmp[M]) {
      tmp[M] = array[i3];
      tmp_idx[M] = i3;
      M = argmax(tmp);
    }
  }

  return tmp_idx;
}

// returns the indices of the top k items
function topK(array, k) {
  let buffer = new Array(array.length);
  arrayCopy(array, buffer);
  for (let i = 0; i < buffer.length; i++) {
    buffer[i] *= -1;
  }

  return bottomK(buffer, k);
}

// returns index of largest element in array of 3 values
function argmax3(array) {
  if (array[0] >= array[1] && array[0] >= array[2]) {
    return 0;
  }  
  else if (array[1] >= array[2]) {
    return 1;
  }
  else {
    return 2;
  }
}

// argmax of an array of positive values
function argmax(array) {
  let M = - 1;
  let idx = -1;
  for (let i = 0; i < array.length; i++) {
    if (array[i] > M) {
      M = array[i];
      idx = i;
    }
  }
  return idx;
}


function movePoints() {
  for (i5 = 0; i5 < num_vertices; i5++) {
    points[i5].x += velocity[i5].x * ping_pong[i5].x;
    points[i5].y += velocity[i5].y * ping_pong[i5].y;
    if (points[i5].x >= width - 1) {
      ping_pong[i5].x *= -1;
      points[i5].x = width - 1;
    }
    if (points[i5].x <= 0) {
      ping_pong[i5].x *= -1;
      points[i5].x = 0;
    }
    if (points[i5].y >= height - 1) {
      ping_pong[i5].y *= -1;
      points[i5].y = height - 1;
    }
    if (points[i5].y <=  0) {
      ping_pong[i5].y *= -1;
      points[i5].y = 0;
    }
  }
}
