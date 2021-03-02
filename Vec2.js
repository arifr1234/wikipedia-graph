// Based on https://gist.github.com/simonewebdesign/6082644

/*
Common vector operations
Author: Tudor Nita | cgrats.com
Version: 0.51

*/
class Vec2 {
    constructor(x_, y_) {
        this.x = x_;
        this.y = y_;
    }

    /* vector * scalar */
    mulS(value) { return new Vec2(this.x * value, this.y * value); };
    /* vector * vector */
    mulV(vec_) { return new Vec2(this.x * vec_.x, this.y * vec_.y); };
    /* vector / scalar */
    divS(value) { return new Vec2(this.x / value, this.y / value); };
    /* vector + scalar */
    addS(value) { return new Vec2(this.x + value, this.y + value); };
    /* vector + vector */
    addV(vec_) { return new Vec2(this.x + vec_.x, this.y + vec_.y); };
    /* vector - scalar */
    subS(value) { return new Vec2(this.x - value, this.y - value); };
    /* vector - vector */
    subV(vec_) { return new Vec2(this.x - vec_.x, this.y - vec_.y); };
    /* vector absolute */
    abs() { return new Vec2(Math.abs(this.x), Math.abs(this.y)); };
    /* dot product */
    dot(vec_) { return (this.x * vec_.x + this.y * vec_.y); };
    /* vector length */
    length() { return Math.sqrt(this.dot(this)); };
    /* vector length, squared */
    lengthSqr() { return this.dot(this); };
    /*
    vector linear interpolation
    interpolate between two vectors.
    value should be in 0.0f - 1.0f space
    */
    lerp(vec_, value) {
        return new Vec2(
            this.x + (vec_.x - this.x) * value,
            this.y + (vec_.y - this.y) * value
        );
    };
    /* normalize */
    normalize() {
        var vlen = this.length();
        return new Vec2(
            this.x / vlen,
            this.y / vlen
        );
    };

    /* [x, y] */
    toArray(){
        return [this.x, this.y];
    }
}