import curses
import random
import time
import requests
import threading

class Snake:
    def __init__(self, window, game_id=None):
        self.window = window
        self.height, self.width = window.getmaxyx()
        self.grid_height = self.height - 4
        self.grid_width = self.width - 4
        
        start_y = self.grid_height // 2 + 2
        start_x = self.grid_width // 2 + 2
        
        self.snake = [(start_y, start_x)]
        self.food = self.generate_food()
        self.direction = curses.KEY_RIGHT
        self.score = 0
        self.game_id = game_id

    def draw_grid(self):
        for y in range(2, self.height-2):
            self.window.addch(y, 2, '|')
            self.window.addch(y, self.width-3, '|')
        
        for x in range(2, self.width-2):
            self.window.addch(2, x, '-')
            self.window.addch(self.height-3, x, '-')
        
        for y in range(3, self.height-2):
            for x in range(3, self.width-3):
                self.window.addch(y, x, '.')

    def generate_food(self):
        while True:
            food = (
                random.randint(3, self.height-4), 
                random.randint(3, self.width-4)
            )
            if food not in self.snake:
                return food

    def move(self):
        head = self.snake[0]
        if self.direction == curses.KEY_UP:
            new_head = (head[0]-1, head[1])
        elif self.direction == curses.KEY_DOWN:
            new_head = (head[0]+1, head[1])
        elif self.direction == curses.KEY_LEFT:
            new_head = (head[0], head[1]-1)
        elif self.direction == curses.KEY_RIGHT:
            new_head = (head[0], head[1]+1)

        self.snake.insert(0, new_head)

        if self.snake[0] == self.food:
            self.score += 1
            self.food = self.generate_food()
        else:
            self.snake.pop()

    def draw(self):
        self.window.clear()
        self.draw_grid()
        
        for y, x in self.snake:
            self.window.addch(y, x, '#')
        
        self.window.addch(self.food[0], self.food[1], '*')
        self.window.addstr(1, 2, f"Scor: {self.score}")
        self.window.refresh()

    def send_score_request(self):
        if self.score > 0:
            try:
                response = requests.post('http://localhost:5000/api/snake', 
                    json={
                        'game_id': self.game_id, 
                        'score': self.score
                    }
                )
            except:
                pass

    def check_collision(self):
        head = self.snake[0]
        if (head[0] <= 2 or head[0] >= self.height-3 or 
            head[1] <= 2 or head[1] >= self.width-3 or 
            head in self.snake[1:]):
            threading.Thread(target=self.send_score_request, daemon=True).start()
            return True
        return False

class Tetris:
    def __init__(self, window, game_id=None):
        self.window = window
        self.height, self.width = window.getmaxyx()
        self.board = [[' ' for _ in range(self.width-2)] for _ in range(self.height-2)]
        self.current_piece = None
        self.score = 0
        self.game_id = game_id

    def generate_piece(self):
        pieces = [
            [[1, 1, 1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1, 1], [0, 1, 0]]
        ]
        return random.choice(pieces)

    def draw(self):
        self.window.clear()
        self.window.border(0)
        
        for y, row in enumerate(self.board):
            for x, cell in enumerate(row):
                self.window.addch(y+1, x+1, cell if cell != ' ' else '.')
        
        self.window.addstr(0, 2, f"Scor: {self.score}")
        self.window.refresh()

class Pong:
    def __init__(self, window, game_id=None):
        self.window = window
        self.height, self.width = window.getmaxyx()
        self.paddle_left = self.height // 2
        self.paddle_right = self.height // 2
        self.ball_x = self.width // 2
        self.ball_y = self.height // 2
        self.ball_dx = 1
        self.ball_dy = 1
        self.score_left = 0
        self.score_right = 0
        self.game_id = game_id

    def move_ball(self):
        self.ball_x += self.ball_dx
        self.ball_y += self.ball_dy

        if self.ball_y <= 1 or self.ball_y >= self.height - 2:
            self.ball_dy *= -1

        if (self.ball_x <= 2 and abs(self.ball_y - self.paddle_left) <= 2) or \
           (self.ball_x >= self.width - 3 and abs(self.ball_y - self.paddle_right) <= 2):
            self.ball_dx *= -1

    def draw(self):
        self.window.clear()
        self.window.border(0)
        
        for i in range(-2, 3):
            self.window.addch(self.paddle_left + i, 2, '|')
            self.window.addch(self.paddle_right + i, self.width - 3, '|')
        
        self.window.addch(self.ball_y, self.ball_x, 'O')
        self.window.addstr(0, 2, f"Stânga: {self.score_left} Dreapta: {self.score_right}")
        self.window.refresh()

class GameMenu:
    def __init__(self, stdscr):
        self.stdscr = stdscr
        curses.curs_set(0)
        self.height, self.width = stdscr.getmaxyx()
        
        self.games = {
            'Snake': self.start_snake_game,
            'Tetris': self.start_tetris_game,
            'Pong': self.start_pong_game
        }
        self.current_selection = 0

    def draw_menu(self):
        self.stdscr.clear()
        game_height = self.height // len(self.games)
        
        for i, game_name in enumerate(self.games.keys()):
            y = i * game_height + game_height // 2
            x = self.width // 2 - len(game_name) // 2
            
            if i == self.current_selection:
                self.stdscr.attron(curses.A_REVERSE)
            
            self.stdscr.addstr(y, x, game_name)
            
            if i == self.current_selection:
                self.stdscr.attroff(curses.A_REVERSE)
        
        self.stdscr.refresh()

    def main_menu(self):
        while True:
            self.draw_menu()
            key = self.stdscr.getch()
            
            if key == curses.KEY_UP:
                self.current_selection = max(0, self.current_selection - 1)
            elif key == curses.KEY_DOWN:
                self.current_selection = min(len(self.games) - 1, self.current_selection + 1)
            elif key == 10:  # Enter key
                game_names = list(self.games.keys())
                selected_game = self.games[game_names[self.current_selection]]
                selected_game()
            elif key == 27:  # ESC key
                break

    def start_snake_game(self):
        game_id = random.randint(1000, 9999)
        game_window = curses.newwin(20, 50, 5, 20)
        game_window.keypad(1)
        game_window.timeout(200)
        
        snake = Snake(game_window, game_id)
        
        while True:
            snake.draw()
            key = game_window.getch()
            
            if key in [curses.KEY_UP, curses.KEY_DOWN, curses.KEY_LEFT, curses.KEY_RIGHT]:
                snake.direction = key
            elif key == 27:  # ESC pentru ieșire
                break
            
            snake.move()
            
            if snake.check_collision():
                game_window.addstr(10, 10, "Game Over!")
                game_window.refresh()
                game_window.getch()
                break

    def start_tetris_game(self):
        game_id = random.randint(1000, 9999)
        game_window = curses.newwin(20, 30, 5, 30)
        game_window.keypad(1)
        game_window.timeout(500)
        
        tetris = Tetris(game_window, game_id)
        
        while True:
            tetris.draw()
            key = game_window.getch()
            
            if key == 27:  # ESC pentru ieșire
                break

    def start_pong_game(self):
        game_id = random.randint(1000, 9999)
        game_window = curses.newwin(20, 50, 5, 20)
        game_window.keypad(1)
        game_window.timeout(100)
        
        pong = Pong(game_window, game_id)
        
        while True:
            pong.move_ball()
            pong.draw()
            
            key = game_window.getch()
            
            if key == curses.KEY_UP:
                pong.paddle_right = max(3, pong.paddle_right - 1)
            elif key == curses.KEY_DOWN:
                pong.paddle_right = min(pong.height - 3, pong.paddle_right + 1)
            
            if key == ord('w'):
                pong.paddle_left = max(3, pong.paddle_left - 1)
            elif key == ord('s'):
                pong.paddle_left = min(pong.height - 3, pong.paddle_left + 1)
            
            elif key == 27:  # ESC pentru ieșire
                break

def main(stdscr):
    game_menu = GameMenu(stdscr)
    game_menu.main_menu()

if __name__ == "__main__":
    curses.wrapper(main)
