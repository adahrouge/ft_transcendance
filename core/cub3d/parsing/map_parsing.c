/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   map_parsing.c                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/14 12:24:20 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/19 16:46:02 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cub3d.h"

int validate_map(t_data *p)
{
	int i;

	i = 0;
	if (!check_column_map(p->map[0], p))
		return 0;
	while (p->map[i] != NULL)
	{
		printf("p->map[i] is %s\n", p->map[i]);
		trimwhitespace_str(p->map[i]); //trimming whitespace at the end
		if (i > 0 && p->map[i] != NULL && p->map[i + 1] != NULL)
		{
			if (!check_previous_line(p, p->map[i], p->map[i - 1])
			|| (!check_next_line(p, p->map[i], p->map[i + 1])))
				return 0;
		}
		if (!check_row_map(p->map[i], p))
			return 0;
		if (p->y_coordinate != -1)
				set_x_coordinate(p, i);
		i++;
	}
	if (!check_column_map(p->map[i - 1], p)) //this is the last line
		return 0;
	if (p->position != 1 || p->x_coordinate == -1)
	{
		p->error_message = "wrong position or coordinate\n";
		return 0;
	}
	return 1;
}
void set_x_coordinate(t_data *p, int i)
{
	if (p->set == 1)
		return ;
	p->x_coordinate = i;
	p->set = 1;
	return ;
}
int check_column_map(char *line, t_data *p)
{
	int i;

	i = 0;
	if (!line)
		return 0;
	while (line[i] != '\0')
	{
		while (line[i] == ' ' || line[i] == '\t')
			i++;
		if (line[i] != '1')
		{
			p->error_message = "map not enclosed with 1";
			return 0;
		}
		i++;
	}
	return 1;
}
int check_previous_line(t_data *p, char *line, char *previous_line)
{
	int len_line;
	int len_previous;
	int i;

	len_line = ft_strlen(line);
	len_previous = ft_strlen(previous_line);
	if (len_line >= len_previous)
		return 1;
	else
	{
		i = len_line;
		while (i <= len_previous && previous_line[i] != '\0')
		{
			if (previous_line[i] != '1')
			{
				p->error_message = "border issue in previous line\n";
				return 0;
			}
			i++;
		}
	}
	return 1;
}
int check_next_line(t_data *p, char *line, char *next_line)
{
	int len_line;
	int len_next;
	int i;

	len_line = ft_strlen(line);
	len_next = ft_strlen(next_line);
	if (len_line >= len_next)
		return 1;
	else
	{
		i = len_line;
		while (i <= len_next && next_line[i] != '\0')
		{
			if (next_line[i] != '1')
			{
				p->error_message = "border issue in next line\n";
				return 0;
			}
			i++;
		}
	}
	return 1;
}

int check_row_map(char *line, t_data *p)
{
	int len;

	len = ft_strlen(line);
	if (!process_map(line, p, &len))
		return 0;
	if (p->position > 1)
	{
		p->error_message = "more than 1 coordinate in map\n";
		return 0;
	}
	return 1;
}

int process_map(char *line, t_data *p, int *len)
{
	int i;

	i = 0;
	
	while (line[i] != '\0')
	{
		while (line[i] == ' ' || line[i] == '\t')
			i++;
		if (line[i] != '1' && line[*len - 1] != '1')
		{
			p->error_message = "borders wrong in map\n";
			return 0;
		}
			if (!check_char_map(p, line, &i))
			{
				p->error_message = "wrong char in map\n";
				return 0;
			}
		i++;
	}
	return 1;
}

int check_char_map(t_data *p, char *line, int *i)
{
	if (line[*i] != '1' && line[*i] != '0' && line[*i] != 'N'
		&& line[*i] != 'S' && line[*i] != 'W' && line[*i] != 'E')
				return 0;
	if (line[*i] == 'N' || line[*i] == 'S'
		|| line[*i] == 'W' || line[*i] == 'E')
		{
			p->y_coordinate = *i;
			p->position++;
		}
	return 1;
}

