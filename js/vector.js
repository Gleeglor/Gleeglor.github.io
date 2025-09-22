            function vector_sum(vectors) {
                const sum = {x: 0, y: 0};

                for (let i = 0; i < vectors.length; i++) {
                    const vector = vectors[i];
                    sum.x = sum.x + vector.x;
                    sum.y = sum.y + vector.y;
                }

                return sum;
            }


            function vector_average(vectors) {
                const sum = vector_sum(vectors);

                return vector_divide(sum, vectors.length);
            }

            function vector_distance(vector_a, vector_b) {
                return distance(vector_a.x, vector_a.y, vector_b.x, vector_b.y);
            }

            function vector_divide(vector, scalar) {
                return {x: vector.x / scalar, y: vector.y / scalar};
            }

            function vector_multiply(vector, scalar) {
                return {x: vector.x * scalar, y: vector.y * scalar};
            }

            function vector_subtract(vector_a, vector_to_subtract) {
                return {x: vector_a.x - vector_to_subtract.x, y: vector_a.y - vector_to_subtract.y};
            }

            function vector_add(vector_a, vector_b) {
                return {x: vector_a.x + vector_b.x, y: vector_a.y + vector_b.y};
            }

            function vector_normalize(vector) {
                const total = Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
                if (total == 0) {
                    return {x: 0, y: 1};
                }

                return {x: vector.x / total, y: vector.y / total};
            }

            function vector_square_magnitude(vector_a, vector_b) {
                return (vector_a.x - vector_b.x) * (vector_a.x - vector_b.x) + (vector_a.y - vector_b.y) * (vector_a.y - vector_b.y);
            }
